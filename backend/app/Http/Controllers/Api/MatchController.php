<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FutsalMatch;
use App\Models\TournamentCategory;
use App\Models\Team;
use App\Models\MatchEvent;
use App\Models\MatchTicketQuota;
use App\Models\Order;
use App\Models\TurnstileLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * MatchController - Pertandingan, Klasemen, Top Scorer & Turnstile Gate
 * Turnamen Utama: Liga Futsal Pelajar (LFP) Cianjur 2026
 * Standar Penilaian Evaluasi Dosen (Pak Yayat)
 */
class MatchController extends Controller
{
    /**
     * GET /api/matches
     * Mengambil daftar seluruh pertandingan futsal dari MySQL
     */
    public function index(Request $request)
    {
        $query = FutsalMatch::with([
            'category',
            'homeTeam',
            'awayTeam',
            'winnerTeam',
            'ticketQuota',
            'events.team'
        ]);

        if ($request->filled('stage')) {
            $query->where('stage', strtoupper($request->stage));
        }

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        $matches = $query->orderBy('match_time', 'asc')->get();
        $categories = TournamentCategory::all();
        $teams = Team::with('category')->orderBy('name', 'asc')->get();

        return response()->json([
            'status'     => 'success',
            'matches'    => $matches,
            'categories' => $categories,
            'teams'      => $teams,
            'data'       => $matches,
        ], 200);
    }

    /**
     * GET /api/matches/{id}
     */
    public function show($id)
    {
        $match = FutsalMatch::with([
            'category',
            'homeTeam',
            'awayTeam',
            'winnerTeam',
            'ticketQuota',
            'events.team'
        ])->find($id);

        if (!$match) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Pertandingan tidak ditemukan di database.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'match'  => $match,
            'data'   => $match,
        ], 200);
    }

    /**
     * GET /api/categories
     */
    public function categories()
    {
        $categories = TournamentCategory::all();
        return response()->json([
            'status'     => 'success',
            'categories' => $categories,
            'data'       => $categories,
        ], 200);
    }

    /**
     * GET /api/teams
     * Mengambil daftar seluruh tim sekolah resmi LFP 2026 (mendukung filter ?group=A atau ?group=B)
     */
    public function teams(Request $request)
    {
        $query = Team::query();
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('group')) {
            $query->where('group', strtoupper($request->group));
        }
        $teams = $query->with('category')->orderBy('group', 'asc')->orderBy('name', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'teams'  => $teams,
            'data'   => $teams,
        ], 200);
    }

    /**
     * GET /api/standings
     * Menghitung KLASEMEN TURNAMEN LFP 2026 secara otomatis dari MySQL.
     * Mendukung pemisahan resmi Divisi 1 SMA Putra Grup A dan Grup B.
     * Logika: Laga FINISHED (FT) -> Menang (+3), Seri (+1), Kalah (0), Selisih Gol (GF - GA).
     */
    public function standings(Request $request)
    {
        $category = TournamentCategory::first();
        $groupFilter = strtoupper(trim($request->query('group', '')));
        $teams = Team::all();

        // Inisialisasi tabel klasemen untuk seluruh tim peserta
        $standingsMap = [];
        foreach ($teams as $team) {
            $standingsMap[$team->id] = [
                'team_id'       => $team->id,
                'team_name'     => $team->name,
                'short_name'    => $team->short_name,
                'group'         => $team->group ?? 'A',
                'logo_color'    => $team->logo_color ?? '#10B981',
                'played'        => 0,
                'won'           => 0,
                'drawn'         => 0,
                'lost'          => 0,
                'goals_for'     => 0,
                'goals_against' => 0,
                'goal_diff'     => 0,
                'points'        => 0,
            ];
        }

        // Ambil semua pertandingan yang sudah selesai (FINISHED)
        $finishedMatches = FutsalMatch::where('status', 'FINISHED')
            ->whereNotNull('home_team_id')
            ->whereNotNull('away_team_id')
            ->get();

        foreach ($finishedMatches as $match) {
            $hId = $match->home_team_id;
            $aId = $match->away_team_id;
            $hScore = (int) $match->home_score;
            $aScore = (int) $match->away_score;

            if (!isset($standingsMap[$hId]) || !isset($standingsMap[$aId])) {
                continue;
            }

            // Jumlah bermain
            $standingsMap[$hId]['played'] += 1;
            $standingsMap[$aId]['played'] += 1;

            // Memasukkan & Kemasukan Gol
            $standingsMap[$hId]['goals_for'] += $hScore;
            $standingsMap[$hId]['goals_against'] += $aScore;
            $standingsMap[$aId]['goals_for'] += $aScore;
            $standingsMap[$aId]['goals_against'] += $hScore;

            // Poin dan Menang/Seri/Kalah
            if ($hScore > $aScore) {
                $standingsMap[$hId]['won'] += 1;
                $standingsMap[$hId]['points'] += 3;
                $standingsMap[$aId]['lost'] += 1;
            } elseif ($aScore > $hScore) {
                $standingsMap[$aId]['won'] += 1;
                $standingsMap[$aId]['points'] += 3;
                $standingsMap[$hId]['lost'] += 1;
            } else {
                $standingsMap[$hId]['drawn'] += 1;
                $standingsMap[$hId]['points'] += 1;
                $standingsMap[$aId]['drawn'] += 1;
                $standingsMap[$aId]['points'] += 1;
            }
        }

        // Hitung Selisih Gol (GD)
        foreach ($standingsMap as &$row) {
            $row['goal_diff'] = $row['goals_for'] - $row['goals_against'];
        }
        unset($row);

        // Fungsi sorting standar: Points DESC, Goal Diff DESC, Goals For DESC, Won DESC
        $sortFn = function ($a, $b) {
            if ($b['points'] !== $a['points']) return $b['points'] <=> $a['points'];
            if ($b['goal_diff'] !== $a['goal_diff']) return $b['goal_diff'] <=> $a['goal_diff'];
            if ($b['goals_for'] !== $a['goals_for']) return $b['goals_for'] <=> $a['goals_for'];
            return $b['won'] <=> $a['won'];
        };

        // Pisahkan per Grup A dan Grup B
        $groupA = array_values(array_filter($standingsMap, fn($t) => ($t['group'] ?? 'A') === 'A'));
        $groupB = array_values(array_filter($standingsMap, fn($t) => ($t['group'] ?? 'A') === 'B'));

        usort($groupA, $sortFn);
        usort($groupB, $sortFn);

        $rankA = 1;
        foreach ($groupA as &$r) { $r['rank'] = $rankA++; }
        unset($r);

        $rankB = 1;
        foreach ($groupB as &$r) { $r['rank'] = $rankB++; }
        unset($r);

        // Gabungan semua tim
        $all = array_values($standingsMap);
        usort($all, $sortFn);
        $rankAll = 1;
        foreach ($all as &$r) { $r['rank'] = $rankAll++; }
        unset($r);

        $finalStandings = $all;
        if ($groupFilter === 'A') {
            $finalStandings = $groupA;
        } elseif ($groupFilter === 'B') {
            $finalStandings = $groupB;
        }

        return response()->json([
            'status'     => 'success',
            'tournament' => $category ? $category->name : 'Liga Futsal Pelajar (LFP) Cianjur 2026',
            'standings'  => array_values($finalStandings),
            'group_a'    => array_values($groupA),
            'group_b'    => array_values($groupB),
        ], 200);
    }

    /**
     * GET /api/top-scorers
     * Menghitung TOP SCORER TURNAMEN secara otomatis dari tabel match_events MySQL
     */
    public function topScorers()
    {
        $scorers = MatchEvent::where('event_type', 'GOAL')
            ->selectRaw('player_name, team_id, count(*) as goals')
            ->groupBy('player_name', 'team_id')
            ->orderByDesc('goals')
            ->with('team')
            ->take(10)
            ->get();

        $rank = 1;
        $result = $scorers->map(function ($s) use (&$rank) {
            return [
                'rank'        => $rank++,
                'player_name' => $s->player_name,
                'team_name'   => $s->team ? $s->team->name : 'Tim Sekolah',
                'short_name'  => $s->team ? $s->team->short_name : 'LFP',
                'logo_color'  => $s->team ? ($s->team->logo_color ?? '#10B981') : '#10B981',
                'goals'       => (int) $s->goals,
            ];
        });

        return response()->json([
            'status'      => 'success',
            'tournament'  => 'Liga Futsal Pelajar (LFP) Cianjur 2026',
            'top_scorers' => $result,
        ], 200);
    }

    /**
     * POST /api/matches
     * Menerbitkan Jadwal Baru & Kuota Tiket
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'      => 'nullable|integer|exists:tournament_categories,id',
            'category_code'    => 'nullable|string',
            'home_team_id'     => 'nullable|integer|exists:teams,id',
            'away_team_id'     => 'nullable|integer|exists:teams,id',
            'home_team_name'   => 'nullable|string|max:150',
            'away_team_name'   => 'nullable|string|max:150',
            'home_placeholder' => 'nullable|string|max:150',
            'away_placeholder' => 'nullable|string|max:150',
            'venue'            => 'nullable|string|max:200',
            'arena'            => 'nullable|string|max:200',
            'stage'            => 'nullable|string|in:GROUP,ROUND_16,QUARTER_FINAL,SEMI_FINAL,FINAL',
            'bracket_slot'     => 'nullable|string|max:20',
            'match_time'       => 'required',
            'total_quota'      => 'nullable|integer|min:1',
            'ticket_price'     => 'nullable|integer|min:0',
        ]);

        $category = TournamentCategory::first();

        // Resolusi Tim Home & Away
        $homeTeamId = $validated['home_team_id'] ?? null;
        $homeName = $validated['home_team_name'] ?? $validated['home_placeholder'] ?? null;
        if (!$homeTeamId && !empty($homeName)) {
            $t = Team::firstOrCreate(['name' => trim($homeName), 'category_id' => $category->id], ['short_name' => mb_substr(trim($homeName), 0, 10)]);
            $homeTeamId = $t->id;
        }

        $awayTeamId = $validated['away_team_id'] ?? null;
        $awayName = $validated['away_team_name'] ?? $validated['away_placeholder'] ?? null;
        if (!$awayTeamId && !empty($awayName)) {
            $t = Team::firstOrCreate(['name' => trim($awayName), 'category_id' => $category->id], ['short_name' => mb_substr(trim($awayName), 0, 10)]);
            $awayTeamId = $t->id;
        }

        try {
            $parsedTime = Carbon::parse($validated['match_time'])->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            $parsedTime = Carbon::now()->addDay()->format('Y-m-d 15:30:00');
        }

        $venue = $validated['arena'] ?? $validated['venue'] ?? 'GOR Gelanggang Generasi Muda (GGM) Cianjur';
        $totalQuota = (int) ($validated['total_quota'] ?? 400);
        $ticketPrice = (int) ($validated['ticket_price'] ?? 20000);
        $stage = $validated['stage'] ?? 'GROUP';

        return DB::transaction(function () use ($category, $homeTeamId, $awayTeamId, $homeName, $awayName, $parsedTime, $venue, $stage, $validated, $totalQuota, $ticketPrice) {
            $match = FutsalMatch::create([
                'category_id'      => $category->id,
                'home_team_id'     => $homeTeamId,
                'away_team_id'     => $awayTeamId,
                'home_placeholder' => $homeName,
                'away_placeholder' => $awayName,
                'match_time'       => $parsedTime,
                'venue'            => $venue,
                'stage'            => $stage,
                'bracket_slot'     => $validated['bracket_slot'] ?? null,
                'status'           => 'UPCOMING',
                'home_score'       => 0,
                'away_score'       => 0,
                'home_fouls'       => 0,
                'away_fouls'       => 0,
            ]);

            $quota = MatchTicketQuota::create([
                'match_id'        => $match->id,
                'total_quota'     => $totalQuota,
                'available_quota' => $totalQuota,
                'held_quota'      => 0,
                'price'           => $ticketPrice,
                'sale_status'     => 'OPEN',
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Jadwal pertandingan LFP 2026 berhasil diterbitkan.',
                'match'   => $match->load(['category', 'homeTeam', 'awayTeam', 'ticketQuota']),
                'data'    => $match,
            ], 201);
        });
    }

    /**
     * Normalisasi string kode tiket ke bentuk kanonikal untuk mengatasi karakter visual ambigu
     * (O <-> 0, B <-> 8, I/L <-> 1, pemisah tanda hubung, dan prefix turnamen)
     */
    private function canonicalCode(string $str): string
    {
        $s = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $str));
        $s = preg_replace('/^(LFPFTX|TIXLFP2026|TIX|FTX)/i', '', $s);
        $s = preg_replace('/T\d+$/i', '', $s); // Hapus suffix sub-tiket misal T1
        // Normalisasi huruf ke angka yang bentuk visualnya identik
        $s = str_replace(['O', 'B', 'I', 'L'], ['0', '8', '1', '1'], $s);
        return $s;
    }

    /**
     * Helper pencarian Order tiket secara cerdas dan toleran terhadap kesalahan ketik
     */
    private function findOrderForVerification(string $rawCode): ?Order
    {
        $code = strtoupper(trim($rawCode));
        if (empty($code)) return null;

        // 1. Bersihkan suffix sub-tiket jika ada (-T1, -T2, dll)
        $baseCode = preg_replace('/-T\d+$/i', '', $code);

        // 2. Pencarian exact match langsung di database
        $order = Order::where(function ($q) use ($code, $baseCode) {
            $q->where('qr_payload', $code)
              ->orWhere('qr_payload', $baseCode)
              ->orWhere('order_code', $code)
              ->orWhere('order_code', $baseCode);
        })->with(['user', 'match.homeTeam', 'match.awayTeam', 'match.category'])->first();

        if ($order) return $order;

        // 3. Pencarian menggunakan bentuk kanonikal (toleran 0 vs O, 8 vs B, strip, dll)
        $targetCanonical = $this->canonicalCode($code);
        if (!empty($targetCanonical)) {
            $recentOrders = Order::with(['user', 'match.homeTeam', 'match.awayTeam', 'match.category'])
                ->latest()
                ->take(100)
                ->get();

            foreach ($recentOrders as $candidate) {
                $candOrderCanon = $this->canonicalCode($candidate->order_code ?? '');
                $candQrCanon = $this->canonicalCode($candidate->qr_payload ?? '');

                if ($targetCanonical === $candOrderCanon || $targetCanonical === $candQrCanon) {
                    return $candidate;
                }

                // Substring match jika kode yang diinput minimal 4 karakter
                if (strlen($targetCanonical) >= 4) {
                    if (str_contains($candOrderCanon, $targetCanonical) || str_contains($targetCanonical, $candOrderCanon) ||
                        str_contains($candQrCanon, $targetCanonical) || str_contains($targetCanonical, $candQrCanon)) {
                        return $candidate;
                    }
                }
            }
        }

        // 4. Pencarian berdasarkan numeric ID (jika operator hanya memasukkan angka ID, misal "2")
        if (is_numeric($code)) {
            $found = Order::where('id', (int)$code)
                ->with(['user', 'match.homeTeam', 'match.awayTeam', 'match.category'])
                ->first();

            if ($found) return $found;
        }

        return null;
    }

    /**
     * POST /api/operator/tickets/verify
     * Verifikasi scan QR Code E-Tiket asli di Pintu Masuk Turnstile GGM
     */
    public function verifyTicket(Request $request)
    {
        $code = trim($request->qr_payload ?? $request->qr_code ?? $request->ticket_code ?? $request->code ?? '');
        $gateName = $request->gate_name ?? $request->gate ?? 'Gate A - Turnstile Utama (Vinyl)';
        $operatorId = $request->user()?->id ?? $request->operator_id ?? 2; // Default ke ID Operator GGM Kang Farhan

        if (empty($code)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Kode QR tiket tidak boleh kosong.'
            ], 422);
        }

        $order = $this->findOrderForVerification($code);

        if (!$order) {
            try {
                TurnstileLog::create([
                    'order_id'     => null,
                    'operator_id'  => $operatorId,
                    'scanned_code' => $code,
                    'gate_name'    => $gateName,
                    'result'       => 'INVALID',
                    'message'      => "Tiket [{$code}] TIDAK VALID / TIDAK TERDAFTAR di database resmi GGM Cianjur.",
                ]);
            } catch (\Exception $e) {}

            return response()->json([
                'status'  => 'error',
                'message' => "Tiket [{$code}] TIDAK VALID / TIDAK TERDAFTAR di database resmi GGM Cianjur."
            ], 404);
        }

        if ($order->status !== 'PAID') {
            try {
                TurnstileLog::create([
                    'order_id'     => $order->id,
                    'operator_id'  => $operatorId,
                    'scanned_code' => $code,
                    'gate_name'    => $gateName,
                    'result'       => 'INVALID',
                    'message'      => "Tiket {$order->order_code} BELUM DIBAYAR (Status: {$order->status}).",
                ]);
            } catch (\Exception $e) {}

            return response()->json([
                'status'  => 'error',
                'message' => "Tiket {$order->order_code} BELUM DIBAYAR (Status: {$order->status}). Akses masuk ditolak!"
            ], 400);
        }

        // Cek jika spesifik token ini sudah pernah di-scan sebelumnya
        $duplicateLog = TurnstileLog::where('scanned_code', $code)->where('result', 'VALID')->latest()->first();
        if ($duplicateLog) {
            $scanTime = $duplicateLog->created_at ? Carbon::parse($duplicateLog->created_at)->setTimezone('Asia/Jakarta')->format('H:i') . ' WIB' : 'Sebelumnya';
            return response()->json([
                'status'        => 'error',
                'is_duplicate'  => true,
                'order_id'      => $order->id,
                'order_code'    => $order->order_code,
                'message'       => "PERINGATAN TIKET GANDA! Tiket [{$order->order_code}] sudah pernah di-scan pada Pukul {$scanTime} di {$duplicateLog->gate_name}. Akses ditolak!"
            ], 400);
        }

        // Jika seluruh pesanan sudah ditandai check-in penuh
        if ($order->is_checked_in) {
            $scanTime = $order->checked_in_at ? Carbon::parse($order->checked_in_at)->setTimezone('Asia/Jakarta')->format('H:i') . ' WIB' : 'Hari ini';
            return response()->json([
                'status'        => 'error',
                'is_duplicate'  => true,
                'order_id'      => $order->id,
                'order_code'    => $order->order_code,
                'message'       => "PERINGATAN TIKET GANDA! Seluruh kuota tiket pada pesanan {$order->order_code} ({$order->quantity} tiket) sudah terpakai pada Pukul {$scanTime} di {$order->checked_in_gate}. Akses ditolak!"
            ], 400);
        }

        // Hitung total scan valid untuk pesanan ini
        $validScansCount = TurnstileLog::where('order_id', $order->id)->where('result', 'VALID')->count() + 1;
        $isFullyCheckedIn = $validScansCount >= $order->quantity;

        // Update status order di database MySQL
        $order->update([
            'is_checked_in'   => $isFullyCheckedIn,
            'checked_in_at'   => Carbon::now(),
            'checked_in_gate' => $gateName,
        ]);

        try {
            TurnstileLog::create([
                'order_id'     => $order->id,
                'operator_id'  => $operatorId,
                'scanned_code' => $code,
                'gate_name'    => $gateName,
                'result'       => 'VALID',
                'message'      => "Akses Gerbang Turnstile Terbuka ({$validScansCount}/{$order->quantity} tiket)",
            ]);
        } catch (\Exception $e) {}

        $hName = $order->match->homeTeam->name ?? $order->match->home_placeholder ?? 'Tim Home';
        $aName = $order->match->awayTeam->name ?? $order->match->away_placeholder ?? 'Tim Away';
        $currentTimeWib = Carbon::now()->setTimezone('Asia/Jakarta')->format('H:i:s') . ' WIB';

        return response()->json([
            'status'  => 'success',
            'message' => "TIKET VALID! Selamat Datang di GGM Cianjur. Gerbang {$gateName} Terbuka.",
            'data'    => [
                'order_id'    => $order->id,
                'order_code'  => $order->order_code,
                'qr_payload'  => $order->qr_payload,
                'holder_name' => $order->user->name ?? 'Penonton Terdaftar',
                'school_name' => $order->user->school_name ?? 'Suporter Sekolah / Umum',
                'match'       => "{$hName} vs {$aName}",
                'stage'       => $order->match->stage ?? 'LFP 2026',
                'arena'       => $order->match->venue ?? 'GOR GGM Cianjur',
                'quantity'    => $order->quantity,
                'gate'        => $gateName,
                'scanned_at'  => $currentTimeWib,
            ],
            'ticket' => [
                'order_code'     => $order->order_code,
                'qr_payload'     => $order->qr_payload,
                'holder_name'    => $order->user->name ?? 'Penonton Terdaftar',
                'school_name'    => $order->user->school_name ?? 'Suporter Sekolah / Umum',
                'seat_category'  => 'TRIBUNE GENERAL ACCESS (LFP 2026)',
                'match'          => [
                    'home_team' => ['name' => $hName],
                    'away_team' => ['name' => $aName],
                    'stage'     => $order->match->stage ?? 'Perempat Final',
                    'arena'     => $order->match->venue ?? 'GOR Gelanggang Generasi Muda (GGM) Cianjur',
                ],
            ]
        ], 200);
    }

    /**
     * POST /api/operator/tickets/reset
     * Reset status check-in tiket untuk keperluan simulasi/pengujian demo operator
     */
    public function resetTicketCheckIn(Request $request)
    {
        $code = trim($request->qr_payload ?? $request->order_code ?? $request->code ?? '');
        $order = null;

        if (!empty($code)) {
            $order = $this->findOrderForVerification($code);
        } else if ($request->filled('order_id')) {
            $order = Order::find($request->order_id);
        } else {
            // Ambil order terakhir berstatus PAID
            $order = Order::where('status', 'PAID')->latest()->first();
        }

        if (!$order) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tiket pesanan tidak ditemukan di database untuk di-reset.'
            ], 404);
        }

        $order->update([
            'is_checked_in'   => false,
            'checked_in_at'   => null,
            'checked_in_gate' => null,
        ]);

        TurnstileLog::where('order_id', $order->id)->delete();

        return response()->json([
            'status'  => 'success',
            'message' => "Tiket [{$order->order_code}] berhasil di-reset menjadi SIAP SCAN (Bisa dipindai kembali).",
            'order'   => $order
        ], 200);
    }

    /**
     * GET /api/operator/tickets/active-test-tickets
     * Mengambil daftar tiket sah (PAID) dari database MySQL untuk pengujian cepat operator
     */
    public function activeTestTickets()
    {
        $orders = Order::where('status', 'PAID')
            ->with(['user', 'match.homeTeam', 'match.awayTeam', 'match.category'])
            ->latest()
            ->take(6)
            ->get();

        return response()->json([
            'status' => 'success',
            'orders' => $orders
        ]);
    }

    /**
     * GET /api/operator/scan-logs
     */
    public function scanLogs()
    {
        $logs = TurnstileLog::with(['order.user'])->latest()->take(20)->get();
        return response()->json(['status' => 'success', 'data' => $logs]);
    }

    /**
     * PATCH /api/matches/{id}/toggle-sale
     */
    public function toggleTicketSale($id)
    {
        $quota = MatchTicketQuota::where('match_id', $id)->first();
        if (!$quota) {
            return response()->json(['status' => 'error', 'message' => 'Kuota tiket tidak ditemukan.'], 404);
        }
        $quota->sale_status = ($quota->sale_status === 'OPEN') ? 'CLOSED' : 'OPEN';
        $quota->save();

        return response()->json([
            'status'      => 'success',
            'message'     => "Status penjualan kuota diubah menjadi {$quota->sale_status}",
            'sale_status' => $quota->sale_status,
        ]);
    }

    /**
     * DELETE /api/matches/{id}
     */
    public function destroy($id)
    {
        $match = FutsalMatch::find($id);
        if (!$match) {
            return response()->json(['status' => 'error', 'message' => 'Pertandingan tidak ditemukan.'], 404);
        }
        $match->delete();
        return response()->json(['status' => 'success', 'message' => 'Pertandingan berhasil dihapus.'], 200);
    }
}
