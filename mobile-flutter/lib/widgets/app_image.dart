import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Network image with a loading placeholder and a broken-image fallback.
/// Renders a neutral placeholder when [url] is null/empty.
class AppImage extends StatelessWidget {
  const AppImage({super.key, required this.url, this.fit = BoxFit.cover});

  final String? url;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final placeholderColor = Theme.of(context).colorScheme.outline.withOpacity(0.12);
    if (url == null || url!.isEmpty) {
      return ColoredBox(
        color: placeholderColor,
        child: const Center(child: Icon(Icons.image_outlined, color: Colors.grey)),
      );
    }
    return CachedNetworkImage(
      imageUrl: url!,
      fit: fit,
      placeholder: (_, __) => ColoredBox(
        color: placeholderColor,
        child: const Center(
          child: SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      errorWidget: (_, __, ___) => ColoredBox(
        color: placeholderColor,
        child: const Center(
          child: Icon(Icons.broken_image_outlined, color: Colors.grey),
        ),
      ),
    );
  }
}
