<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\Team;
use App\Models\MatchDetail;
use App\Models\MatchTicketQuota;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Disable foreign key checks & Truncate tabel lama biar gak bentrok
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        User::truncate();
        Tournament::truncate();
        TournamentCategory::truncate();
        Team::truncate();
        MatchDetail::truncate();
        MatchTicketQuota::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Seed Users (Admin, Panitia, Penonton)
        $admin = User::create([
            'name' => 'Admin FutsalTix',
            'email' => 'admin@futsaltix.com',
            'password' => Hash::make('password123'),
            'user_type' => 'admin',
            'status' => 'active',
        ]);

        $panitia = User::create([
            'name' => 'Panitia GGM Cianjur',
            'email' => 'panitia@futsaltix.com',
            'password' => Hash::make('password123'),
            'user_type' => 'panitia',
            'status' => 'active',
        ]);

        $penonton = User::create([
            'name' => 'Sandi Rusmana',
            'email' => 'sandi@gmail.com',
            'password' => Hash::make('password123'),
            'user_type' => 'penonton',
            'status' => 'active',
        ]);

        // 2. Seed Tournament
        $tournament = Tournament::create([
            'created_by' => $admin->id,
            'title' => 'Cianjur Student Futsal Championship 2026',
            'description' => 'Turnamen futsal terbesar antar pelajar SMP & SMA/SMK se-Kabupaten Cianjur.',
            'status' => 'published',
        ]);

        // 3. Seed Categories
        $catSMA = TournamentCategory::create([
            'tournament_id' => $tournament->id,
            'category_name' => 'SMA/SMK',
        ]);

        $catSMP = TournamentCategory::create([
            'tournament_id' => $tournament->id,
            'category_name' => 'SMP',
        ]);

        // 4. Seed Teams
        $smkn1 = Team::create(['team_name' => 'SMKN 1 Cianjur', 'school_name' => 'SMK Negeri 1 Cianjur']);
        $sman2 = Team::create(['team_name' => 'SMAN 2 Cianjur', 'school_name' => 'SMA Negeri 2 Cianjur']);
        $sman1 = Team::create(['team_name' => 'SMAN 1 Cianjur', 'school_name' => 'SMA Negeri 1 Cianjur']);
        $smkn2 = Team::create(['team_name' => 'SMKN 2 Cianjur', 'school_name' => 'SMK Negeri 2 Cianjur']);
        $smpn1 = Team::create(['team_name' => 'SMPN 1 Cianjur', 'school_name' => 'SMP Negeri 1 Cianjur']);
        $smpn4 = Team::create(['team_name' => 'SMPN 4 Cianjur', 'school_name' => 'SMP Negeri 4 Cianjur']);

        // 5. Seed Matches & Ticket Quotas
        $match1 = MatchDetail::create([
            'category_id' => $catSMA->id,
            'home_team_id' => $smkn1->id,
            'away_team_id' => $sman2->id,
            'match_date' => '2026-11-14 15:30:00',
            'venue' => 'GGM Cianjur',
            'status' => 'scheduled',
        ]);

        MatchTicketQuota::create([
            'match_id' => $match1->id,
            'total_quota' => 200,
            'held_quota' => 0,
            'available_quota' => 200,
            'ticket_price' => 15000.00,
        ]);

        $match2 = MatchDetail::create([
            'category_id' => $catSMA->id,
            'home_team_id' => $sman1->id,
            'away_team_id' => $smkn2->id,
            'match_date' => '2026-11-14 18:30:00',
            'venue' => 'GGM Cianjur',
            'status' => 'scheduled',
        ]);

        MatchTicketQuota::create([
            'match_id' => $match2->id,
            'total_quota' => 150,
            'held_quota' => 0,
            'available_quota' => 150,
            'ticket_price' => 15000.00,
        ]);

        $match3 = MatchDetail::create([
            'category_id' => $catSMP->id,
            'home_team_id' => $smpn1->id,
            'away_team_id' => $smpn4->id,
            'match_date' => '2026-11-15 14:00:00',
            'venue' => 'GGM Cianjur',
            'status' => 'scheduled',
        ]);

        MatchTicketQuota::create([
            'match_id' => $match3->id,
            'total_quota' => 100,
            'held_quota' => 0,
            'available_quota' => 100,
            'ticket_price' => 10000.00,
        ]);
    }
}