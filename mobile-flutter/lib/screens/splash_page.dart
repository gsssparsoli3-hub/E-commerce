import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/empty_state.dart';
import 'auth_page.dart';
import 'home_shell.dart';

/// Boot screen: loads store settings (and refreshes the session when one
/// exists in memory), then routes to the home shell or the auth screen.
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final settings = context.read<SettingsProvider>();
    await settings.load();
    if (!mounted) return;
    if (settings.error != null) {
      setState(() {
        _error = settings.error;
        _loading = false;
      });
      return;
    }

    // The session token lives in memory only (no persistence by design), so
    // a cold start always begins at the auth screen. If a session exists
    // (e.g. after a hot reload), refresh the profile before continuing.
    final auth = context.read<AuthProvider>();
    if (auth.isAuthed) {
      try {
        await auth.fetchMe();
      } catch (_) {
        auth.logout();
      }
    }
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => auth.isAuthed ? const HomeShell() : const AuthPage(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: _error != null
            ? EmptyState(
                icon: Icons.cloud_off,
                title: 'Unable to reach the store',
                message: _error,
                actionLabel: 'Retry',
                onAction: _bootstrap,
              )
            : Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(28),
                      ),
                      child: Icon(
                        Icons.shopping_bag_rounded,
                        size: 48,
                        color: theme.colorScheme.onPrimary,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Shoperic',
                      style: theme.textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Shopping made delightful',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.hintColor),
                    ),
                    const SizedBox(height: 36),
                    const CircularProgressIndicator(),
                  ],
                ),
              ),
      ),
    );
  }
}
