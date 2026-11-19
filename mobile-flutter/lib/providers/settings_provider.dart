import 'package:flutter/material.dart';

import '../models/app_settings.dart';
import '../services/api_service.dart';

/// Loads and exposes store-wide settings from /api/settings.
class SettingsProvider extends ChangeNotifier {
  SettingsProvider(this._api);

  final ApiService _api;

  AppSettings? _settings;
  bool _loading = false;
  String? _error;

  AppSettings? get settings => _settings;
  bool get loading => _loading;
  String? get error => _error;

  /// Brand color from settings, falling back to the Shoperic orange.
  Color get primaryColor =>
      _settings?.primaryColorValue ?? const Color(0xFFEA580C);

  Future<void> load() async {
    _loading = true;
    notifyListeners();
    try {
      _settings = await _api.fetchSettings();
      _error = null;
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
