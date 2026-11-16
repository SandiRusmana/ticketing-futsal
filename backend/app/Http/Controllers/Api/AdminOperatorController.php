<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminOperatorController extends Controller
{
    // Cek daftar operator yang statusnya masih pending
    public function indexPending()
    {
        $operators = User::where('role', 'operator')
            ->where('status', 'pending')
            ->get();

        return response()->json([
            'data' => $operators
        ]);
    }

    // Admin melakukan ACC (approved) atau Reject (rejected) Operator
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $operator = User::where('role', 'operator')->findOrFail($id);
        $operator->update(['status' => $request->status]);

        return response()->json([
            'message' => "Status operator {$operator->name} berhasil diubah menjadi {$request->status}.",
            'data' => $operator
        ]);
    }
}