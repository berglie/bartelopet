# ⌨️ Keyboard Shortcuts Guide

## Image Viewer Keyboard Controls

When viewing images in the gallery, you can use these keyboard shortcuts:

### Navigation
- **← (Left Arrow)** or **h** - Previous image
  - If at first image of completion → Goes to previous completion
  - Vim-style: `h` also works

- **→ (Right Arrow)** or **l** - Next image
  - If at last image of completion → Goes to next completion
  - Vim-style: `l` also works

### Actions
- **ESC (Escape)** - Close the image viewer

---

## How It Works

### Within a Completion
If a submission has multiple images (e.g., 5 images):
1. Press **→** to go through images 1 → 2 → 3 → 4 → 5
2. At image 5, press **→** again to go to the next submission
3. Press **←** to go back through images 5 → 4 → 3 → 2 → 1
4. At image 1, press **←** again to go to the previous submission

### Across Completions
- Navigation automatically transitions between submissions
- Seamless experience when browsing the gallery
- No need to close and reopen the viewer

### Visual Feedback
- Current image highlighted in thumbnail strip
- Image counter shows position: "3 / 5" (within submission)
- Submission counter shows: "Innsending 2 / 20" (across gallery)
- Keyboard hint shown in viewer: "← → Navigér • ESC Lukk"

---

## Alternative Navigation Methods

### Mouse/Trackpad
- Click left/right arrow buttons
- Click thumbnails to jump to specific image
- Click outside viewer or X button to close

### Touch (Mobile)
- Swipe left/right to navigate images
- Tap thumbnails to jump to specific image
- Tap X button to close

---

## Accessibility

The keyboard shortcuts make the viewer:
- ✅ **Fully accessible** without mouse
- ✅ **Fast navigation** for power users
- ✅ **Vim-style support** (h/l keys)
- ✅ **Standard conventions** (arrows, ESC)

---

## Tips

1. **Rapid browsing**: Hold down arrow keys to quickly browse through all images
2. **Jump to specific image**: Click thumbnail, then use arrows to navigate from there
3. **Close quickly**: Press ESC anytime to close the viewer
4. **Vim users**: Use h/l for left/right navigation (feels natural!)

---

## Implementation Details

### Technical
- Uses `useKeyboardNav` custom hook
- Event listeners attached when viewer is open
- Automatic cleanup when viewer closes
- Prevents default browser behavior (page scrolling)

### Props
```typescript
useKeyboardNav({
  enabled: isOpen,           // Only active when viewer is open
  onClose,                   // ESC key handler
  onPrevious: () => {...},   // ← arrow / h key handler
  onNext: () => {...},       // → arrow / l key handler
})
```

### Keys Handled
- `ArrowLeft` - Previous image
- `ArrowRight` - Next image
- `h` - Previous image (vim-style)
- `l` - Next image (vim-style)
- `Escape` - Close viewer

---

## User Experience

### Before (Without Keyboard Support)
- ❌ Must use mouse to click arrows
- ❌ Slow navigation through many images
- ❌ Need to find and click close button

### After (With Keyboard Support)
- ✅ Lightning-fast navigation with arrows
- ✅ Quick browsing through entire gallery
- ✅ Instant close with ESC
- ✅ No mouse needed

---

## Testing Checklist

Test these scenarios:

### Basic Navigation
- [ ] Open viewer, press → to go to next image
- [ ] Press ← to go to previous image
- [ ] Press ESC to close viewer

### Within Completion
- [ ] Navigate through all images in a submission
- [ ] Verify counter updates correctly
- [ ] Check thumbnail highlighting follows current image

### Across Completions
- [ ] At last image, press → to go to next completion
- [ ] At first image, press ← to go to previous completion
- [ ] Verify smooth transition between submissions

### Edge Cases
- [ ] At first image of first submission, ← does nothing
- [ ] At last image of last submission, → does nothing
- [ ] ESC works from any image
- [ ] Keyboard works after clicking thumbnails

### Vim-style Keys
- [ ] Press `h` to go previous
- [ ] Press `l` to go next
- [ ] Works same as arrow keys

---

**All keyboard shortcuts are now fully functional!** ⌨️✨
