<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminOperatorController extends Controller
{
    // Cek daftar seluruh operator dari MySQL (bisa difilter status)
    public function index(Request $request)
    {
        $query = User::where('role', 'operator');

        if ($request->filled('status')) {
            $query->where('status', strtolower($request->status));
        }

        $operators = $query->latest()->get();

        return response()->json([
            'status' => 'success',
            'data'   => $operators,
        ]);
    }

    public function indexPending(Request $request)
    {
        return $this->index($request);
    }

    // Admin mendaftarkan operator baru langsung ke database
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        $status = strtolower($request->approval_status ?? $request->status ?? 'approved');

        $operator = User::create([
            'name'               => $request->name,
            'email'              => $request->email,
            'phone'              => $request->phone ?? ('0812' . rand(10000000, 99999999)),
            'password'           => Hash::make($request->password),
            'role'               => 'operator',
            'status'             => $status,
            'assigned_gate'      => $request->assigned_gate ?? $request->gate ?? 'Gate A (Barat)',
            'school_affiliation' => $request->affiliation ?? 'Panitia GGM Cianjur',
        ]);

        return response()->json([
            'status'   => 'success',
            'message'  => "Operator {$operator->name} berhasil disimpan ke database.",
            'operator' => $operator,
            'data'     => $operator,
        ], 201);
    }

    // Admin melakukan ACC (approved) atau Reject (rejected) Operator
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,pending'
        ]);

        $operator = User::where('role', 'operator')->findOrFail($id);
        $operator->update(['status' => $request->status]);

        return response()->json([
            'status'  => 'success',
            'message' => "Status operator {$operator->name} berhasil diubah menjadi {$request->status}.",
            'data'    => $operator,
        ]);
    }
}