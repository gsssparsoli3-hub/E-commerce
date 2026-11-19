import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/settings_provider.dart';
import '../screens/home_shell.dart';
import 'login_form.dart';
import 'register_form.dart';

/// Login / Register screen with tabs. Shown when there is no session.
class AuthPage extends StatelessWidget {
  const AuthPage({super.key});

  /// Replaces the current route with the main app shell.
  static void goHome(BuildContext context) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeShell()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>().settings;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 92,
                height: 92,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(
                  Icons.shopping_bag_rounded,
                  size: 46,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                settings?.siteName ?? 'Shoperic',
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                (settings?.tagline ?? '').isEmpty
                    ? 'Shopping made delightful'
                    : settings!.tagline,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).hintColor),
              ),
              const Spacer(),
              const TabBar(
                tabs: [
                  Tab(text: 'Login'),
                  Tab(text: 'Register'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    LoginForm(onSuccess: () => goHome(context)),
                    RegisterForm(onSuccess: () => goHome(context)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
