<?php

namespace Database\Seeders;

use App\Models\FutsalMatch;
use App\Models\MatchEvent;
use App\Models\MatchTicketQuota;
use App\Models\Order;
use App\Models\Team;
use App\Models\TournamentCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * DatabaseSeeder - FutsalTix Cianjur
 * Turnamen Resmi: Liga Futsal Pelajar (LFP) Cianjur 2026
 * Divisi 1 SMA Putra: 20 Sekolah Peserta Resmi (Grup A & Grup B)
 * Mengacu pada data klasemen resmi @lfp_cianjur
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Nonaktifkan foreign key checks sementara untuk reset data bersih
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        MatchEvent::truncate();
        Order::truncate();
        MatchTicketQuota::truncate();
        FutsalMatch::truncate();
        Team::truncate();
        TournamentCategory::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ======================================================================
        // 1. AKUN PENGGUNA RESMI (ADMIN, OPERATOR, SUPORTER)
        // ======================================================================
        $admin = User::updateOrCreate(
            ['email' => 'admin@futsaltix.id'],
            [
                'name'     => 'Super Admin GGM',
                'phone'    => '081200000001',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
                'status'   => 'approved',
            ]
        );

        $operator = User::updateOrCreate(
            ['email' => 'operator@futsaltix.id'],
            [
                'name'          => 'Kang Farhan (Operator GGM)',
                'phone'         => '081200000002',
                'password'      => Hash::make('password123'),
                'role'          => 'operator',
                'status'        => 'approved',
                'assigned_gate' => 'Gate A - Turnstile Utama (Vinyl)',
            ]
        );

        $suporter = User::updateOrCreate(
            ['email' => 'suporter@futsaltix.id'],
            [
                'name'                => 'Ahmad Fauzi',
                'phone'               => '081234567890',
                'password'            => Hash::make('password123'),
                'role'                => 'user',
                'status'              => 'approved',
                'school_affiliation'  => 'SMAN 1 Cianjur',
            ]
        );

        // ======================================================================
        // 2. KATEGORI TURNAMEN UTAMA: LIGA FUTSAL PELAJAR (LFP) 2026
        // ======================================================================
        $lfp = TournamentCategory::create([
            'code'         => 'LFP',
            'name'         => 'Liga Futsal Pelajar (LFP) Cianjur 2026',
            'ticket_price' => 20000,
        ]);

        // ======================================================================
        // 3. 20 SEKOLAH RESMI PESERTA LFP CIANJUR (DIVISI 1 SMA PUTRA)
        // ======================================================================
        $teams = [
            // --- GRUP A (10 Sekolah) ---
            'pacet'       => Team::create(['category_id' => $lfp->id, 'name' => 'SMAN 1 Pacet',         'short_name' => 'PACET',        'group' => 'A', 'logo_color' => '#10B981']),
            'smansa'      => Team::create(['category_id' => $lfp->id, 'name' => 'SMAN 1 Cianjur',       'short_name' => 'SMANSA',       'group' => 'A', 'logo_color' => '#C6FF00']),
            'smacil'      => Team::create(['category_id' => $lfp->id, 'name' => 'SMAN 1 Cilaku',        'short_name' => 'SMACIL',       'group' => 'A', 'logo_color' => '#EC4899']),
            'sukaluyu'    => Team::create(['category_id' => $lfp->id, 'name' => 'SMKN 1 Sukaluyu',      'short_name' => 'SUKALUYU',     'group' => 'A', 'logo_color' => '#3B82F6']),
            'nuris'       => Team::create(['category_id' => $lfp->id, 'name' => 'SMK Nurul Islam',      'short_name' => 'NURIS',        'group' => 'A', 'logo_color' => '#F59E0B']),
            'mandapa'     => Team::create(['category_id' => $lfp->id, 'name' => 'MAN 2 Cianjur',        'short_name' => 'MANDAPA',      'group' => 'A', 'logo_color' => '#8B5CF6']),
            'smkn1'       => Team::create(['category_id' => $lfp->id, 'name' => 'SMKN 1 Cianjur',       'short_name' => 'ZIE',          'group' => 'A', 'logo_color' => '#06B6D4']),
            'alkamil'     => Team::create(['category_id' => $lfp->id, 'name' => 'SMA Al Kamil IBS',     'short_name' => 'ALKAMIL',      'group' => 'A', 'logo_color' => '#6366F1']),
            'sukanagara'  => Team::create(['category_id' => $lfp->id, 'name' => 'SMAN 1 Sukanagara',   'short_name' => 'SUKANAGARA',   'group' => 'A', 'logo_color' => '#14B8A6']),
            'alibrohim'   => Team::create(['category_id' => $lfp->id, 'name' => 'SMK Al-Ibrohimiyah',   'short_name' => 'ALIBROHIM',    'group' => 'A', 'logo_color' => '#EF4444']),

            // --- GRUP B (10 Sekolah) ---
            'smkn2cil'    => Team::create(['category_id' => $lfp->id, 'name' => 'SMKN 2 Cilaku',        'short_name' => 'SMKN2CIL',     'group' => 'B', 'logo_color' => '#10B981']),
            'man1'        => Team::create(['category_id' => $lfp->id, 'name' => 'MAN 1 Cianjur',        'short_name' => 'MANSA',        'group' => 'B', 'logo_color' => '#C6FF00']),
            'cibeber'     => Team::create(['category_id' => $lfp->id, 'name' => 'SMAN 1 Cibeber',       'short_name' => 'CIBEBER',      'group' => 'B', 'logo_color' => '#3B82F6']),
            'alittihad'   => Team::create(['category_id' => $lfp->id, 'name' => 'SMA Al Ittihad Cianjur','short_name' => 'ALITTIHAD',   'group' => 'B', 'logo_color' => '#F59E0B']),
            'mardiyah'    => Team::create(['category_id' => $lfp->id, 'name' => "SMAT Al Ma'shum Mardiyah", 'short_name' => 'MARDIYAH', 'group' => 'B', 'logo_color' => '#8B5CF6']),
            'pasundan'    => Team::create(['category_id' => $lfp->id, 'name' => 'SMK Pasundan 1',      'short_name' => 'PASUNDAN',     'group' => 'B', 'logo_color' => '#EC4899']),
            'buper'       => Team::create(['category_id' => $lfp->id, 'name' => 'SMK Bunga Persada',   'short_name' => 'BUPER',        'group' => 'B', 'logo_color' => '#06B6D4']),
            'damtu'       => Team::create(['category_id' => $lfp->id, 'name' => 'SMK Darul Muttaqin Cianjur', 'short_name' => 'DAMTU', 'group' => 'B', 'logo_color' => '#F97316']),
            'ciranjang'   => Team::create(['category_id' => $lfp->id, 'name' => 'SMAN 1 Ciranjang',     'short_name' => 'CIRANJANG',    'group' => 'B', 'logo_color' => '#EF4444']),
            'warkon'      => Team::create(['category_id' => $lfp->id, 'name' => 'SMAN 1 Warungkondang', 'short_name' => 'WARKON',       'group' => 'B', 'logo_color' => '#64748B']),
        ];

        // ======================================================================
        // 4. HASIL PERTANDINGAN RESMI (FINISHED) SESUAI KLASEMEN @lfp_cianjur
        // ======================================================================
        $venueDefault = 'GOR Gelanggang Generasi Muda (GGM) Cianjur';

        $finishedMatchesData = [
            // --- GRUP A (10 Pertandingan) ---
            // 1. Pacet vs Al Kamil (3 - 0)
            [
                'home' => $teams['pacet']->id, 'away' => $teams['alkamil']->id,
                'h_score' => 3, 'a_score' => 0, 'winner' => $teams['pacet']->id,
                'goals' => [
                    ['team' => $teams['pacet']->id, 'player' => 'Aldi Kurnia (Pacet)', 'minute' => 8],
                    ['team' => $teams['pacet']->id, 'player' => 'Aldi Kurnia (Pacet)', 'minute' => 19],
                    ['team' => $teams['pacet']->id, 'player' => 'Randi Fauzan (Pacet)', 'minute' => 32],
                ]
            ],
            // 2. Pacet vs Al-Ibrohimiyah (5 - 3)
            [
                'home' => $teams['pacet']->id, 'away' => $teams['alibrohim']->id,
                'h_score' => 5, 'a_score' => 3, 'winner' => $teams['pacet']->id,
                'goals' => [
                    ['team' => $teams['pacet']->id, 'player' => 'Aldi Kurnia (Pacet)', 'minute' => 5],
                    ['team' => $teams['alibrohim']->id, 'player' => 'Fikri Haikal (Al-Ibrohim)', 'minute' => 12],
                    ['team' => $teams['pacet']->id, 'player' => 'Randi Fauzan (Pacet)', 'minute' => 18],
                    ['team' => $teams['alibrohim']->id, 'player' => 'Fikri Haikal (Al-Ibrohim)', 'minute' => 24],
                    ['team' => $teams['pacet']->id, 'player' => 'Aldi Kurnia (Pacet)', 'minute' => 27],
                    ['team' => $teams['pacet']->id, 'player' => 'Bagus Setiawan (Pacet)', 'minute' => 33],
                    ['team' => $teams['alibrohim']->id, 'player' => 'Danu Ramadhan (Al-Ibrohim)', 'minute' => 37],
                    ['team' => $teams['pacet']->id, 'player' => 'Bagus Setiawan (Pacet)', 'minute' => 39],
                ]
            ],
            // 3. SMAN 1 Cianjur vs Sukanagara (5 - 2)
            [
                'home' => $teams['smansa']->id, 'away' => $teams['sukanagara']->id,
                'h_score' => 5, 'a_score' => 2, 'winner' => $teams['smansa']->id,
                'goals' => [
                    ['team' => $teams['smansa']->id, 'player' => 'Rizky Pratama (Smansa)', 'minute' => 6],
                    ['team' => $teams['sukanagara']->id, 'player' => 'Deden Sopyan (Sukanagara)', 'minute' => 14],
                    ['team' => $teams['smansa']->id, 'player' => 'Rizky Pratama (Smansa)', 'minute' => 22],
                    ['team' => $teams['smansa']->id, 'player' => 'Tegar Ardiansyah (Smansa)', 'minute' => 29],
                    ['team' => $teams['sukanagara']->id, 'player' => 'Deden Sopyan (Sukanagara)', 'minute' => 34],
                    ['team' => $teams['smansa']->id, 'player' => 'Ahmad Fauzi (Smansa)', 'minute' => 37],
                    ['team' => $teams['smansa']->id, 'player' => 'Rizky Pratama (Smansa)', 'minute' => 39],
                ]
            ],
            // 4. SMAN 1 Cianjur vs Nurul Islam (3 - 2)
            [
                'home' => $teams['smansa']->id, 'away' => $teams['nuris']->id,
                'h_score' => 3, 'a_score' => 2, 'winner' => $teams['smansa']->id,
                'goals' => [
                    ['team' => $teams['smansa']->id, 'player' => 'Rizky Pratama (Smansa)', 'minute' => 9],
                    ['team' => $teams['nuris']->id, 'player' => 'Bayu Saputra (Nuris)', 'minute' => 16],
                    ['team' => $teams['smansa']->id, 'player' => 'Tegar Ardiansyah (Smansa)', 'minute' => 25],
                    ['team' => $teams['nuris']->id, 'player' => 'Bayu Saputra (Nuris)', 'minute' => 31],
                    ['team' => $teams['smansa']->id, 'player' => 'Ahmad Fauzi (Smansa)', 'minute' => 38],
                ]
            ],
            // 5. SMAN 1 Cilaku vs Sukanagara (2 - 0)
            [
                'home' => $teams['smacil']->id, 'away' => $teams['sukanagara']->id,
                'h_score' => 2, 'a_score' => 0, 'winner' => $teams['smacil']->id,
                'goals' => [
                    ['team' => $teams['smacil']->id, 'player' => 'Gilang Permana (Smacil)', 'minute' => 11],
                    ['team' => $teams['smacil']->id, 'player' => 'Arya Nugraha (Smacil)', 'minute' => 36],
                ]
            ],
            // 6. SMAN 1 Cilaku vs SMKN 1 Cianjur (3 - 1)
            [
                'home' => $teams['smacil']->id, 'away' => $teams['smkn1']->id,
                'h_score' => 3, 'a_score' => 1, 'winner' => $teams['smacil']->id,
                'goals' => [
                    ['team' => $teams['smacil']->id, 'player' => 'Gilang Permana (Smacil)', 'minute' => 15],
                    ['team' => $teams['smkn1']->id, 'player' => 'Fajar Nugraha (Zie)', 'minute' => 26],
                    ['team' => $teams['smacil']->id, 'player' => 'Gilang Permana (Smacil)', 'minute' => 30],
                    ['team' => $teams['smacil']->id, 'player' => 'Arya Nugraha (Smacil)', 'minute' => 38],
                ]
            ],
            // 7. SMKN 1 Sukaluyu vs Al-Ibrohimiyah (4 - 0)
            [
                'home' => $teams['sukaluyu']->id, 'away' => $teams['alibrohim']->id,
                'h_score' => 4, 'a_score' => 0, 'winner' => $teams['sukaluyu']->id,
                'goals' => [
                    ['team' => $teams['sukaluyu']->id, 'player' => 'Yoga Pratama (Sukaluyu)', 'minute' => 7],
                    ['team' => $teams['sukaluyu']->id, 'player' => 'Yoga Pratama (Sukaluyu)', 'minute' => 17],
                    ['team' => $teams['sukaluyu']->id, 'player' => 'Ilham Maulana (Sukaluyu)', 'minute' => 28],
                    ['team' => $teams['sukaluyu']->id, 'player' => 'Ilham Maulana (Sukaluyu)', 'minute' => 35],
                ]
            ],
            // 8. MAN 2 Cianjur vs SMKN 1 Sukaluyu (3 - 2)
            [
                'home' => $teams['mandapa']->id, 'away' => $teams['sukaluyu']->id,
                'h_score' => 3, 'a_score' => 2, 'winner' => $teams['mandapa']->id,
                'goals' => [
                    ['team' => $teams['mandapa']->id, 'player' => 'Rafi Alamsyah (Mandapa)', 'minute' => 10],
                    ['team' => $teams['sukaluyu']->id, 'player' => 'Yoga Pratama (Sukaluyu)', 'minute' => 14],
                    ['team' => $teams['mandapa']->id, 'player' => 'Rafi Alamsyah (Mandapa)', 'minute' => 22],
                    ['team' => $teams['sukaluyu']->id, 'player' => 'Yoga Pratama (Sukaluyu)', 'minute' => 30],
                    ['team' => $teams['mandapa']->id, 'player' => 'Bintang Kusuma (Mandapa)', 'minute' => 37],
                ]
            ],
            // 9. SMK Nurul Islam vs SMA Al Kamil (3 - 2)
            [
                'home' => $teams['nuris']->id, 'away' => $teams['alkamil']->id,
                'h_score' => 3, 'a_score' => 2, 'winner' => $teams['nuris']->id,
                'goals' => [
                    ['team' => $teams['nuris']->id, 'player' => 'Bayu Saputra (Nuris)', 'minute' => 8],
                    ['team' => $teams['alkamil']->id, 'player' => 'Wildan Hakim (Al Kamil)', 'minute' => 15],
                    ['team' => $teams['nuris']->id, 'player' => 'Bayu Saputra (Nuris)', 'minute' => 21],
                    ['team' => $teams['alkamil']->id, 'player' => 'Wildan Hakim (Al Kamil)', 'minute' => 29],
                    ['team' => $teams['nuris']->id, 'player' => 'Farid Akbar (Nuris)', 'minute' => 36],
                ]
            ],
            // 10. SMKN 1 Cianjur vs MAN 2 Cianjur (2 - 1)
            [
                'home' => $teams['smkn1']->id, 'away' => $teams['mandapa']->id,
                'h_score' => 2, 'a_score' => 1, 'winner' => $teams['smkn1']->id,
                'goals' => [
                    ['team' => $teams['smkn1']->id, 'player' => 'Fajar Nugraha (Zie)', 'minute' => 12],
                    ['team' => $teams['mandapa']->id, 'player' => 'Rafi Alamsyah (Mandapa)', 'minute' => 24],
                    ['team' => $teams['smkn1']->id, 'player' => 'Fajar Nugraha (Zie)', 'minute' => 35],
                ]
            ],

            // --- GRUP B (10 Pertandingan) ---
            // 11. Bunga Persada vs Darul Muttaqin (1 - 1)
            [
                'home' => $teams['buper']->id, 'away' => $teams['damtu']->id,
                'h_score' => 1, 'a_score' => 1, 'winner' => null,
                'goals' => [
                    ['team' => $teams['buper']->id, 'player' => 'Reno Aditya (Buper)', 'minute' => 17],
                    ['team' => $teams['damtu']->id, 'player' => 'Syahrul Ramadhan (Damtu)', 'minute' => 28],
                ]
            ],
            // 12. SMA Al Ittihad vs SMK Darul Muttaqin (1 - 0)
            [
                'home' => $teams['alittihad']->id, 'away' => $teams['damtu']->id,
                'h_score' => 1, 'a_score' => 0, 'winner' => $teams['alittihad']->id,
                'goals' => [
                    ['team' => $teams['alittihad']->id, 'player' => 'Haikal Rabbani (Al Ittihad)', 'minute' => 25],
                ]
            ],
            // 13. SMAN 1 Cibeber vs SMA Al Ittihad (2 - 1)
            [
                'home' => $teams['cibeber']->id, 'away' => $teams['alittihad']->id,
                'h_score' => 2, 'a_score' => 1, 'winner' => $teams['cibeber']->id,
                'goals' => [
                    ['team' => $teams['cibeber']->id, 'player' => 'Dandi Gunawan (Cibeber)', 'minute' => 13],
                    ['team' => $teams['alittihad']->id, 'player' => 'Haikal Rabbani (Al Ittihad)', 'minute' => 22],
                    ['team' => $teams['cibeber']->id, 'player' => 'Dandi Gunawan (Cibeber)', 'minute' => 34],
                ]
            ],
            // 14. SMAN 1 Cibeber vs SMAN 1 Warungkondang (3 - 1)
            [
                'home' => $teams['cibeber']->id, 'away' => $teams['warkon']->id,
                'h_score' => 3, 'a_score' => 1, 'winner' => $teams['cibeber']->id,
                'goals' => [
                    ['team' => $teams['cibeber']->id, 'player' => 'Dandi Gunawan (Cibeber)', 'minute' => 7],
                    ['team' => $teams['warkon']->id, 'player' => 'Yuda Pratama (Warkon)', 'minute' => 18],
                    ['team' => $teams['cibeber']->id, 'player' => 'Rian Hidayat (Cibeber)', 'minute' => 27],
                    ['team' => $teams['cibeber']->id, 'player' => 'Rian Hidayat (Cibeber)', 'minute' => 36],
                ]
            ],
            // 15. MAN 1 Cianjur vs SMAN 1 Warungkondang (2 - 0)
            [
                'home' => $teams['man1']->id, 'away' => $teams['warkon']->id,
                'h_score' => 2, 'a_score' => 0, 'winner' => $teams['man1']->id,
                'goals' => [
                    ['team' => $teams['man1']->id, 'player' => 'Ikbal Fauzi (Mansa)', 'minute' => 16],
                    ['team' => $teams['man1']->id, 'player' => 'Ikbal Fauzi (Mansa)', 'minute' => 31],
                ]
            ],
            // 16. MAN 1 Cianjur vs SMK Pasundan 1 (2 - 0)
            [
                'home' => $teams['man1']->id, 'away' => $teams['pasundan']->id,
                'h_score' => 2, 'a_score' => 0, 'winner' => $teams['man1']->id,
                'goals' => [
                    ['team' => $teams['man1']->id, 'player' => 'Ikbal Fauzi (Mansa)', 'minute' => 12],
                    ['team' => $teams['man1']->id, 'player' => 'Diki Wahyudi (Mansa)', 'minute' => 33],
                ]
            ],
            // 17. SMK Pasundan 1 vs SMK Bunga Persada (2 - 1)
            [
                'home' => $teams['pasundan']->id, 'away' => $teams['buper']->id,
                'h_score' => 2, 'a_score' => 1, 'winner' => $teams['pasundan']->id,
                'goals' => [
                    ['team' => $teams['pasundan']->id, 'player' => 'Riki Subagja (Pasundan)', 'minute' => 9],
                    ['team' => $teams['buper']->id, 'player' => 'Reno Aditya (Buper)', 'minute' => 21],
                    ['team' => $teams['pasundan']->id, 'player' => 'Riki Subagja (Pasundan)', 'minute' => 35],
                ]
            ],
            // 18. SMKN 2 Cilaku vs SMAN 1 Ciranjang (4 - 2)
            [
                'home' => $teams['smkn2cil']->id, 'away' => $teams['ciranjang']->id,
                'h_score' => 4, 'a_score' => 2, 'winner' => $teams['smkn2cil']->id,
                'goals' => [
                    ['team' => $teams['smkn2cil']->id, 'player' => 'Fikri Anugrah (Smkn2cil)', 'minute' => 6],
                    ['team' => $teams['ciranjang']->id, 'player' => 'Arif Budiman (Ciranjang)', 'minute' => 14],
                    ['team' => $teams['smkn2cil']->id, 'player' => 'Fikri Anugrah (Smkn2cil)', 'minute' => 20],
                    ['team' => $teams['ciranjang']->id, 'player' => 'Arif Budiman (Ciranjang)', 'minute' => 28],
                    ['team' => $teams['smkn2cil']->id, 'player' => 'Fikri Anugrah (Smkn2cil)', 'minute' => 33],
                    ['team' => $teams['smkn2cil']->id, 'player' => 'Gani Permadi (Smkn2cil)', 'minute' => 38],
                ]
            ],
            // 19. SMKN 2 Cilaku vs SMAT Al Ma'shum Mardiyah (3 - 1)
            [
                'home' => $teams['smkn2cil']->id, 'away' => $teams['mardiyah']->id,
                'h_score' => 3, 'a_score' => 1, 'winner' => $teams['smkn2cil']->id,
                'goals' => [
                    ['team' => $teams['smkn2cil']->id, 'player' => 'Fikri Anugrah (Smkn2cil)', 'minute' => 11],
                    ['team' => $teams['mardiyah']->id, 'player' => 'Fajar Shiddiq (Mardiyah)', 'minute' => 19],
                    ['team' => $teams['smkn2cil']->id, 'player' => 'Gani Permadi (Smkn2cil)', 'minute' => 26],
                    ['team' => $teams['smkn2cil']->id, 'player' => 'Fikri Anugrah (Smkn2cil)', 'minute' => 37],
                ]
            ],
            // 20. SMAT Al Ma'shum Mardiyah vs SMAN 1 Ciranjang (2 - 1)
            [
                'home' => $teams['mardiyah']->id, 'away' => $teams['ciranjang']->id,
                'h_score' => 2, 'a_score' => 1, 'winner' => $teams['mardiyah']->id,
                'goals' => [
                    ['team' => $teams['mardiyah']->id, 'player' => 'Fajar Shiddiq (Mardiyah)', 'minute' => 14],
                    ['team' => $teams['ciranjang']->id, 'player' => 'Arif Budiman (Ciranjang)', 'minute' => 25],
                    ['team' => $teams['mardiyah']->id, 'player' => 'Fajar Shiddiq (Mardiyah)', 'minute' => 34],
                ]
            ],
        ];

        foreach ($finishedMatchesData as $idx => $m) {
            $match = FutsalMatch::create([
                'category_id'      => $lfp->id,
                'home_team_id'     => $m['home'],
                'away_team_id'     => $m['away'],
                'home_placeholder' => null,
                'away_placeholder' => null,
                'match_time'       => Carbon::now()->subDays(2)->addHours($idx),
                'venue'            => $venueDefault,
                'stage'            => 'GROUP',
                'bracket_slot'     => 'GR-' . ($idx + 1),
                'status'           => 'FINISHED',
                'home_score'       => $m['h_score'],
                'away_score'       => $m['a_score'],
                'home_fouls'       => rand(1, 4),
                'away_fouls'       => rand(1, 4),
                'match_minute'     => 'FT',
                'winner_team_id'   => $m['winner'],
            ]);

            foreach ($m['goals'] as $g) {
                MatchEvent::create([
                    'match_id'    => $match->id,
                    'team_id'     => $g['team'],
                    'player_name' => $g['player'],
                    'event_type'  => 'GOAL',
                    'minute'      => $g['minute'],
                ]);
            }
        }

        // ======================================================================
        // 5. JADWAL LIVE & UPCOMING RESMI (TIKET DAPAT DIPESAN)
        // ======================================================================
        $upcomingMatchesData = [
            // Match 1: UPCOMING HARI INI -> SMAN 1 Pacet vs MAN 1 Cianjur (Big Match Juara Grup)
            [
                'home' => $teams['pacet']->id, 'away' => $teams['man1']->id,
                'time' => Carbon::now()->setTime(15, 30),
                'stage' => 'QUARTER_FINAL', 'slot' => 'QF-1', 'status' => 'UPCOMING',
                'quota' => 500, 'available' => 240, 'price' => 20000,
            ],
            // Match 2: UPCOMING MALAM INI -> SMAN 1 Cianjur vs SMKN 2 Cilaku
            [
                'home' => $teams['smansa']->id, 'away' => $teams['smkn2cil']->id,
                'time' => Carbon::now()->setTime(19, 30),
                'stage' => 'QUARTER_FINAL', 'slot' => 'QF-2', 'status' => 'UPCOMING',
                'quota' => 500, 'available' => 115, 'price' => 20000,
            ],
            // Match 3: UPCOMING BESOK SORE -> SMAN 1 Cilaku vs SMAN 1 Cibeber
            [
                'home' => $teams['smacil']->id, 'away' => $teams['cibeber']->id,
                'time' => Carbon::now()->addDay()->setTime(15, 30),
                'stage' => 'QUARTER_FINAL', 'slot' => 'QF-3', 'status' => 'UPCOMING',
                'quota' => 450, 'available' => 320, 'price' => 20000,
            ],
            // Match 4: UPCOMING BESOK MALAM -> SMKN 1 Sukaluyu vs SMA Al Ittihad Cianjur
            [
                'home' => $teams['sukaluyu']->id, 'away' => $teams['alittihad']->id,
                'time' => Carbon::now()->addDay()->setTime(19, 30),
                'stage' => 'QUARTER_FINAL', 'slot' => 'QF-4', 'status' => 'UPCOMING',
                'quota' => 450, 'available' => 280, 'price' => 20000,
            ],
            // Match 5: SEMIFINAL 1
            [
                'home' => null, 'away' => null,
                'home_p' => 'Pemenang QF 1', 'away_p' => 'Pemenang QF 2',
                'time' => Carbon::now()->addDays(3)->setTime(15, 30),
                'stage' => 'SEMI_FINAL', 'slot' => 'SF-1', 'status' => 'UPCOMING',
                'quota' => 600, 'available' => 520, 'price' => 25000,
            ],
            // Match 6: SEMIFINAL 2
            [
                'home' => null, 'away' => null,
                'home_p' => 'Pemenang QF 3', 'away_p' => 'Pemenang QF 4',
                'time' => Carbon::now()->addDays(3)->setTime(19, 30),
                'stage' => 'SEMI_FINAL', 'slot' => 'SF-2', 'status' => 'UPCOMING',
                'quota' => 600, 'available' => 500, 'price' => 25000,
            ],
            // Match 7: GRAND FINAL
            [
                'home' => null, 'away' => null,
                'home_p' => 'Pemenang SF 1', 'away_p' => 'Pemenang SF 2',
                'time' => Carbon::now()->addDays(5)->setTime(19, 30),
                'stage' => 'FINAL', 'slot' => 'FINAL', 'status' => 'UPCOMING',
                'quota' => 700, 'available' => 650, 'price' => 30000,
            ],
        ];

        $createdUpcoming = [];
        foreach ($upcomingMatchesData as $up) {
            $m = FutsalMatch::create([
                'category_id'      => $lfp->id,
                'home_team_id'     => $up['home'] ?? null,
                'away_team_id'     => $up['away'] ?? null,
                'home_placeholder' => $up['home_p'] ?? null,
                'away_placeholder' => $up['away_p'] ?? null,
                'match_time'       => $up['time'],
                'venue'            => $venueDefault,
                'stage'            => $up['stage'],
                'bracket_slot'     => $up['slot'],
                'status'           => $up['status'],
                'home_score'       => 0,
                'away_score'       => 0,
                'home_fouls'       => 0,
                'away_fouls'       => 0,
                'match_minute'     => null,
                'winner_team_id'   => null,
            ]);

            MatchTicketQuota::create([
                'match_id'        => $m->id,
                'total_quota'     => $up['quota'],
                'available_quota' => $up['available'],
                'held_quota'      => 0,
                'price'           => $up['price'],
                'sale_status'     => 'OPEN',
            ]);

            $createdUpcoming[] = $m;
        }

        // ======================================================================
        // 6. SEED TIKET ASLI (ORDER SUDAH DIBAYAR UNTUK TESTING SUPORTER)
        // ======================================================================
        $testMatch1 = $createdUpcoming[0]; // Pacet vs MAN 1
        $testMatch2 = $createdUpcoming[1]; // SMAN 1 Cianjur vs SMKN 2 Cilaku
        $testMatch3 = $createdUpcoming[2]; // SMAN 1 Cilaku vs SMAN 1 Cibeber

        $orderCode1 = 'LFP-FTX-' . strtoupper(Str::random(8));
        $qrToken1 = 'TIX-LFP2026-' . strtoupper(Str::random(6)) . '-' . strtoupper(substr(md5($orderCode1), 0, 8));

        Order::create([
            'order_code'      => $orderCode1,
            'user_id'         => $suporter->id,
            'match_id'        => $testMatch1->id,
            'quantity'        => 2,
            'unit_price'      => 20000,
            'admin_fee'       => 2500,
            'total_amount'    => 42500,
            'status'          => 'PAID',
            'payment_method'  => 'Midtrans Snap (QRIS)',
            'snap_token'      => 'sample-snap-' . Str::uuid(),
            'expires_at'      => Carbon::now()->addDays(1),
            'paid_at'         => Carbon::now()->subHours(1),
            'qr_payload'      => $qrToken1,
            'is_checked_in'   => false,
            'checked_in_at'   => null,
            'checked_in_by'   => null,
            'checked_in_gate' => null,
        ]);

        $orderCode2 = 'LFP-FTX-' . strtoupper(Str::random(8));
        $qrToken2 = 'TIX-LFP2026-' . strtoupper(Str::random(6)) . '-' . strtoupper(substr(md5($orderCode2), 0, 8));

        Order::create([
            'order_code'      => $orderCode2,
            'user_id'         => $suporter->id,
            'match_id'        => $testMatch2->id,
            'quantity'        => 1,
            'unit_price'      => 20000,
            'admin_fee'       => 2500,
            'total_amount'    => 22500,
            'status'          => 'PAID',
            'payment_method'  => 'Midtrans Snap (BCA VA)',
            'snap_token'      => 'sample-snap-' . Str::uuid(),
            'expires_at'      => Carbon::now()->addDays(1),
            'paid_at'         => Carbon::now()->subMinutes(30),
            'qr_payload'      => $qrToken2,
            'is_checked_in'   => false,
            'checked_in_at'   => null,
            'checked_in_by'   => null,
            'checked_in_gate' => null,
        ]);

        $orderCode3 = 'LFP-FTX-' . strtoupper(Str::random(8));
        $qrToken3 = 'TIX-LFP2026-' . strtoupper(Str::random(6)) . '-' . strtoupper(substr(md5($orderCode3), 0, 8));

        Order::create([
            'order_code'      => $orderCode3,
            'user_id'         => $suporter->id,
            'match_id'        => $testMatch3->id,
            'quantity'        => 3,
            'unit_price'      => 20000,
            'admin_fee'       => 2500,
            'total_amount'    => 62500,
            'status'          => 'PAID',
            'payment_method'  => 'Midtrans Snap (GoPay)',
            'snap_token'      => 'sample-snap-' . Str::uuid(),
            'expires_at'      => Carbon::now()->addDays(1),
            'paid_at'         => Carbon::now()->subMinutes(15),
            'qr_payload'      => $qrToken3,
            'is_checked_in'   => false,
            'checked_in_at'   => null,
            'checked_in_by'   => null,
            'checked_in_gate' => null,
        ]);
    }
}
