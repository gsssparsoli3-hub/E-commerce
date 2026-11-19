import 'package:flutter/foundation.dart';

import '../models/api_results.dart';
import '../models/user.dart';
import '../services/api_service.dart';

/// Holds the signed-in user and their bearer token (kept in memory only —
/// the token is injected into the shared [ApiService] on every change).
class AuthProvider extends ChangeNotifier {
  AuthProvider(this._api);

  final ApiService _api;

  User? _user;
  String? _token;
  bool _busy = false;

  User? get user => _user;
  String? get token => _token;
  bool get isAuthed => _token != null;
  bool get busy => _busy;

  /// The shared API client (screens use it for endpoints that do not need
  /// their own provider, e.g. addresses, wishlist, reviews).
  ApiService get api => _api;

  Future<void> login(String email, String password) async {
    _busy = true;
    notifyListeners();
    try {
      _apply(await _api.login(email: email, password: password));
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    _busy = true;
    notifyListeners();
    try {
      _apply(await _api.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
      ));
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  void _apply(AuthResult result) {
    _user = result.user;
    _token = result.token;
    _api.token = result.token;
  }

  /// Refreshes the profile from /api/auth/me. Throws [ApiException] when the
  /// session is no longer valid.
  Future<void> fetchMe() async {
    _user = await _api.fetchMe();
    notifyListeners();
  }

  Future<void> updateProfile({String? name, String? phone}) async {
    _user = await _api.updateProfile(name: name, phone: phone);
    notifyListeners();
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _user = await _api.updateProfile(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
    notifyListeners();
  }

  void logout() {
    _user = null;
    _token = null;
    _api.token = null;
    notifyListeners();
  }
}
