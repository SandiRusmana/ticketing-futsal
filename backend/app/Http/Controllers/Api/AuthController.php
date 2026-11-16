<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    // 1. REGISTRASI
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:250',
            'email' => 'required|string|email|max:250|unique:users',
            'password' => 'required|string|min:8', // Ditambahkan huruf 'u' pada required
            'role' => 'nullable|in:user,operator',
        ]);

        $role = $request->role ?? 'user';
        $status = ($role === 'operator') ? 'pending' : 'approved';

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
            'status' => $status,
        ]);

        if ($status === 'pending') { // Perbaikan typo 'panding' ke 'pending'
            return response()->json([
                'message' => 'Registrasi Operator berhasil. Silahkan tunggu persetujuan admin',
                'status' => 'pending'
            ], 201);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    // 2. LOGIN MANUAL
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->status === 'pending') {
            return response()->json([
                'message' => 'Akun Anda sedang dalam peninjauan Admin. Mohon tunggu persetujuan.'
            ], 403);
        }

        if ($user->status === 'rejected') {
            return response()->json([
                'message' => 'Pendaftaran akun Anda telah ditolak oleh Admin.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    // 3. LOGIN GOOGLE OAUTH
    public function handleGoogleCallback(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            $googleUser = Socialite::driver('google')->stateless()->userFromToken($request->token);

            $user = User::firstOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                    'password' => null,
                    'role' => 'user',
                    'status' => 'approved',
                ]
            );

            if (!$user->google_id) {
                $user->update(['google_id' => $googleUser->getId()]);
            }

            if ($user->status !== 'approved') {
                return response()->json([
                    'message' => 'Akun Anda tidak aktif atau menunggu persetujuan.'
                ], 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login Google Berhasil',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token Google tidak valid',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    // 4. LOGOUT
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Berhasil logout'
        ]);
    }

    // 5. GET PROFIL USER SAYA
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }
}