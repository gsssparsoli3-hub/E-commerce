import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/catalog_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/splash_page.dart';
import 'services/api_service.dart';

void main() => runApp(const ShopericApp());

/// Root of the Shoperic mobile app.
///
/// A single [ApiService] instance is shared by every provider so that the
/// bearer token set by [AuthProvider] after login is automatically used by
/// the catalog, cart and settings providers.
class ShopericApp extends StatelessWidget {
  const ShopericApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ApiService();
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(api)),
        ChangeNotifierProvider(create: (_) => SettingsProvider(api)),
        ChangeNotifierProvider(create: (_) => CatalogProvider(api)),
        ChangeNotifierProvider(create: (_) => CartProvider(api)),
      ],
      child: MaterialApp(
        title: 'Shoperic',
        debugShowCheckedModeBanner: false,
        theme: _theme(Brightness.light),
        darkTheme: _theme(Brightness.dark),
        themeMode: ThemeMode.system,
        home: const SplashPage(),
      ),
    );
  }

  ThemeData _theme(Brightness brightness) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFFEA580C), // Shoperic orange
      brightness: brightness,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
      ),
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
