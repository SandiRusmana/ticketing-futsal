<?php

namespace Database\Seeders;

use App\Models\FutsalMatch;
use App\Models\MatchEvent;
use App\Models\MatchTicketQuota;
use App\Models\Team;
use App\Models\TournamentCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Default Testing
        User::updateOrCreate(
            ['email' => 'admin@futsaltix.id'],
            [
                'name' => 'Super Admin GGM',
                'phone' => '081200000001',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'operator@futsaltix.id'],
            [
                'name' => 'Operator Gate Utara',
                'phone' => '081200000002',
                'password' => Hash::make('password123'),
                'role' => 'operator',
                'assigned_gate' => 'GATE A - TRIBUN UTARA',
            ]
        );

        User::updateOrCreate(
            ['email' => 'suporter@futsaltix.id'],
            [
                'name' => 'Sandi Rusmana',
                'phone' => '081234567890',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'school_affiliation' => 'SMKN 1 Cianjur',
            ]
        );

        // 2. Kategori Divisi
        $sd = TournamentCategory::create(['code' => 'SD', 'name' => 'Divisi SD / MI Sederajat', 'ticket_price' => 10000]);
        $smp = TournamentCategory::create(['code' => 'SMP', 'name' => 'Divisi SMP / MTs Sederajat', 'ticket_price' => 15000]);
        $sma = TournamentCategory::create(['code' => 'SMA', 'name' => 'Divisi SMA / SMK / MA Sederajat', 'ticket_price' => 20000]);

        // 3. Tim Sekolah Cianjur
        $smansa = Team::create(['category_id' => $sma->id, 'name' => 'SMAN 1 Cianjur', 'short_name' => 'SMANSA', 'logo_color' => '#C6FF00']);
        $smkn1 = Team::create(['category_id' => $sma->id, 'name' => 'SMKN 1 Cianjur', 'short_name' => 'ZIE', 'logo_color' => '#3B82F6']);
        $man1 = Team::create(['category_id' => $sma->id, 'name' => 'MAN 1 Cianjur', 'short_name' => 'MANSA', 'logo_color' => '#10B981']);
        $smanda = Team::create(['category_id' => $sma->id, 'name' => 'SMAN 2 Cianjur', 'short_name' => 'SMANDA', 'logo_color' => '#F59E0B']);

        $smpn1 = Team::create(['category_id' => $smp->id, 'name' => 'SMPN 1 Cianjur', 'short_name' => 'SPENSA', 'logo_color' => '#8B5CF6']);
        $smpn2 = Team::create(['category_id' => $smp->id, 'name' => 'SMPN 2 Cianjur', 'short_name' => 'SPENDA', 'logo_color' => '#EC4899']);

        $sdn1 = Team::create(['category_id' => $sd->id, 'name' => 'SDN Ibu Jenab 1', 'short_name' => 'IBUJENAB', 'logo_color' => '#EF4444']);
        $sdn2 = Team::create(['category_id' => $sd->id, 'name' => 'SDN Solokpandan', 'short_name' => 'SOLOK', 'logo_color' => '#06B6D4']);

        // 4. Jadwal Pertandingan + Kuota Tiket
        $matchesData = [
            [
                'category_id' => $sma->id,
                'home_team_id' => $smansa->id,
                'away_team_id' => $smkn1->id,
                'match_time' => now()->addDays(1)->setTime(19, 30),
                'stage' => 'QUARTER_FINAL',
                'bracket_slot' => 'QF-1',
                'status' => 'UPCOMING',
                'quota' => 500,
                'available' => 142,
                'price' => 20000,
            ],
            [
                'category_id' => $sma->id,
                'home_team_id' => $man1->id,
                'away_team_id' => $smanda->id,
                'match_time' => now(),
                'stage' => 'QUARTER_FINAL',
                'bracket_slot' => 'QF-2',
                'status' => 'LIVE',
                'home_score' => 3,
                'away_score' => 2,
                'home_fouls' => 3,
                'away_fouls' => 4,
                'match_minute' => "32' Babak 2",
                'quota' => 500,
                'available' => 18,
                'price' => 20000,
            ],
            [
                'category_id' => $smp->id,
                'home_team_id' => $smpn1->id,
                'away_team_id' => $smpn2->id,
                'match_time' => now()->addDays(1)->setTime(15, 00),
                'stage' => 'SEMI_FINAL',
                'bracket_slot' => 'SF-1',
                'status' => 'UPCOMING',
                'quota' => 400,
                'available' => 265,
                'price' => 15000,
            ],
            [
                'category_id' => $sd->id,
                'home_team_id' => $sdn1->id,
                'away_team_id' => $sdn2->id,
                'match_time' => now()->subHours(3),
                'stage' => 'FINAL',
                'bracket_slot' => 'FINAL',
                'status' => 'FINISHED',
                'home_score' => 4,
                'away_score' => 1,
                'home_fouls' => 2,
                'away_fouls' => 3,
                'match_minute' => 'FT',
                'winner_team_id' => $sdn1->id,
                'quota' => 350,
                'available' => 0,
                'price' => 10000,
            ],
        ];

        foreach ($matchesData as $data) {
            $match = FutsalMatch::create([
                'category_id' => $data['category_id'],
                'home_team_id' => $data['home_team_id'],
                'away_team_id' => $data['away_team_id'],
                'match_time' => $data['match_time'],
                'stage' => $data['stage'],
                'bracket_slot' => $data['bracket_slot'],
                'status' => $data['status'],
                'home_score' => $data['home_score'] ?? 0,
                'away_score' => $data['away_score'] ?? 0,
                'home_fouls' => $data['home_fouls'] ?? 0,
                'away_fouls' => $data['away_fouls'] ?? 0,
                'match_minute' => $data['match_minute'] ?? null,
                'winner_team_id' => $data['winner_team_id'] ?? null,
            ]);

            MatchTicketQuota::create([
                'match_id' => $match->id,
                'total_quota' => $data['quota'],
                'available_quota' => $data['available'],
                'held_quota' => 0,
                'price' => $data['price'],
                'sale_status' => $data['status'] === 'FINISHED' ? 'CLOSED' : 'OPEN',
            ]);

            if ($data['status'] === 'LIVE') {
                MatchEvent::create(['match_id' => $match->id, 'team_id' => $man1->id, 'player_name' => 'Rizky Pratama', 'event_type' => 'GOAL', 'minute' => 6]);
                MatchEvent::create(['match_id' => $match->id, 'team_id' => $smanda->id, 'player_name' => 'Fajar Nugraha', 'event_type' => 'GOAL', 'minute' => 14]);
                MatchEvent::create(['match_id' => $match->id, 'team_id' => $man1->id, 'player_name' => 'Ilham Maulana', 'event_type' => 'GOAL', 'minute' => 23]);
                MatchEvent::create(['match_id' => $match->id, 'team_id' => $smanda->id, 'player_name' => 'Dika Saputra', 'event_type' => 'GOAL', 'minute' => 27]);
                MatchEvent::create(['match_id' => $match->id, 'team_id' => $man1->id, 'player_name' => 'Rizky Pratama', 'event_type' => 'GOAL', 'minute' => 30]);
            }
        }
    }
}