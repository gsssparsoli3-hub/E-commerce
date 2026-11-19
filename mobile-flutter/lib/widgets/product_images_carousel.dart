import 'package:flutter/material.dart';

import 'app_image.dart';

/// Full-width image carousel with dot indicators (product detail page).
class ProductImagesCarousel extends StatefulWidget {
  const ProductImagesCarousel({super.key, required this.images});

  final List<String> images;

  @override
  State<ProductImagesCarousel> createState() => _ProductImagesCarouselState();
}

class _ProductImagesCarouselState extends State<ProductImagesCarousel> {
  final _controller = PageController();
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.images;
    return SizedBox(
      height: 320,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (images.isEmpty)
            const AppImage(url: null)
          else PageView.builder(
            controller: _controller,
            itemCount: images.length,
            onPageChanged: (index) => setState(() => _index = index),
            itemBuilder: (context, index) => AppImage(url: images[index]),
          ),
          if (images.length > 1)
            Positioned(
              bottom: 10,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(images.length, (index) {
                  final active = _index == index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: active ? 20 : 7,
                    height: 7,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      color: active
                          ? Theme.of(context).colorScheme.primary
                          : Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}
