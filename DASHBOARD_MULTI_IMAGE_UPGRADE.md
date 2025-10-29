# Dashboard Multi-Image Upgrade Guide

## What's New? 🎉

Your dashboard now supports:
- ✅ **Upload multiple images** (up to 10)
- ✅ **Change starred/primary image** (with vote reset warning)
- ✅ **Delete individual images** (except the last one)
- ✅ **Add captions** to each image
- ✅ **View all images** in a beautiful grid
- ✅ **Manage everything** from one dialog

---

## Files Created

### 1. **ManageImagesDialog** - `/components/manage-images-dialog.tsx`
A comprehensive dialog for managing all images:
- Grid view of all images
- Star/unstar any image (primary image selector)
- Delete individual images (with confirmation)
- Add captions to images
- Upload more images (up to max 10)
- Shows starred image with special styling
- Vote reset warning when changing primary image

### 2. **CompletionDisplayMulti** - `/components/completion-display-multi.tsx`
Updated dashboard display component:
- Shows starred image prominently with gold border
- Displays thumbnail grid of other images (up to 3 shown)
- "+N more" indicator if more than 3 additional images
- "Administrer bilder" button to open management dialog
- Quick "Legg til flere bilder" button if only 1 image
- Image count badge

---

## Integration Steps

### Step 1: Update Dashboard Page

In `/app/dashboard/page.tsx`, replace the import at the top:

```typescript
// OLD:
import { CompletionDisplay } from '@/components/completion-display'

// NEW:
import { CompletionDisplayMulti } from '@/components/completion-display-multi'
```

Then update line 101:

```typescript
// OLD:
<CompletionDisplay completion={completion} />

// NEW:
<CompletionDisplayMulti completion={completion} />
```

That's it! 🎉

---

## Features Explained

### 1. Main Dashboard View

**Starred Image Display:**
- Large display of the primary/starred image
- Gold border indicates this is the contest entry
- "Hovedbilde" badge in top-left corner
- Image count badge in bottom-right (e.g., "3 bilder")

**Thumbnail Grid:**
- Shows up to 3 additional images below the main image
- Click any thumbnail to open management dialog
- "+N" button if more than 3 additional images

**Quick Actions:**
- Hover over main image to see "Administrer bilder" button
- If only 1 image: shows "Legg til flere bilder" button

### 2. Manage Images Dialog

**Grid View:**
- All images displayed in 2-column responsive grid
- Starred image has gold ring/border
- Each image shows current caption

**Per-Image Actions:**
- **Star button** (⭐): Click to make this the primary image
  - Shows confirmation dialog (warns about vote reset)
  - Only one image can be starred at a time
- **Delete button** (🗑️): Remove the image
  - Shows confirmation dialog
  - Cannot delete if it's the only image
  - Auto-stars next image if deleting starred one

**Captions:**
- Text input below each image
- Max 200 characters
- Auto-saves on change
- Character counter shown

**Add More Images:**
- "Legg til flere bilder" button at bottom
- Drag-and-drop or click to upload
- Max 10 images total
- Shows remaining slots (e.g., "5 igjen")

---

## User Experience Flow

### Scenario 1: Add More Images

1. User opens dashboard
2. Sees their single image with "Legg til flere bilder" button
3. Clicks button → Management dialog opens
4. Scrolls to bottom → Clicks "Legg til flere bilder"
5. Selects image from device
6. Image uploads and appears in grid
7. Can add caption, star it, or keep adding more

### Scenario 2: Change Primary Image

1. User opens dashboard
2. Clicks "Administrer bilder" (hover over main image)
3. Sees all their images in grid
4. Clicks star icon on different image
5. **Warning dialog appears:** "Alle stemmer vil bli nullstilt"
6. Confirms or cancels
7. If confirmed: new image becomes primary, votes reset
8. Dashboard updates to show new starred image

### Scenario 3: Delete Image

1. Opens management dialog
2. Clicks trash icon on an image
3. **Confirmation dialog:** "Slett bilde?"
4. Confirms → Image deleted
5. If it was starred: next image auto-starred
6. Cannot delete if it's the last image

---

## Safety Features

### Vote Protection
- **Warning displayed** when changing starred image
- Clear explanation that votes will be reset
- User must explicitly confirm
- Prevents accidental vote resets

### Last Image Protection
- **Cannot delete** the last remaining image
- Delete button disabled when only 1 image
- Database trigger also prevents this
- Ensures completion always has at least one image

### Validation
- Max 10 images per completion
- Max 10MB per image file
- Only image file types accepted
- Max 200 characters for captions
- Exactly one starred image required

---

## Technical Details

### API Calls Used
- `getCompletionImages(completionId)` - Fetch all images
- `addCompletionImage(...)` - Upload new image
- `updateStarredImage(...)` - Change primary image (resets votes)
- `deleteCompletionImage(...)` - Remove image
- `updateImageCaption(...)` - Save caption

### State Management
- Images fetched on component mount
- Refetches after any change
- Optimistic updates for captions
- Loading states for uploads/deletes

### Performance
- Images lazy-loaded via Next.js Image component
- Only 3 thumbnails shown initially
- Full grid in dialog for management
- Efficient re-renders

---

## UI/UX Highlights

### Visual Design
- **Gold accent color** for starred images (matches your theme)
- **Ring/border** around starred image (2px accent color)
- **Badge overlays** for status indicators
- **Responsive grid** (1 column mobile, 2 on desktop)
- **Hover effects** on thumbnails and buttons

### Accessibility
- Clear labels for all actions
- Confirmation dialogs for destructive actions
- Disabled states when actions not available
- Screen reader friendly

### Norwegian Language
- All UI text in Norwegian
- Error messages in Norwegian
- Confirmation dialogs in Norwegian
- Tooltips and placeholders in Norwegian

---

## Error Handling

### Common Errors

**"Kunne ikke hente bilder"**
- Issue fetching images from database
- Solution: Refresh page, check network

**"Maksimalt 10 bilder tillatt"**
- Trying to upload when at limit
- Solution: Delete an image first

**"Bildet er for stort. Maksimal størrelse er 10MB"**
- File too large
- Solution: Compress image before upload

**"Kan ikke slette det siste bildet"**
- Trying to delete when only 1 image
- Solution: Add another image first

**"Stemmer vil bli nullstilt"**
- Warning, not an error
- Changing starred image resets votes
- User can cancel or confirm

---

## Testing Checklist

After integration, test these scenarios:

- [ ] View completion with single image
- [ ] Click "Legg til flere bilder" button
- [ ] Upload second image successfully
- [ ] See both images in grid
- [ ] Change which image is starred
- [ ] Confirm vote reset warning appears
- [ ] Delete non-starred image
- [ ] Try to delete last image (should be disabled)
- [ ] Add caption to image
- [ ] Caption saves correctly
- [ ] Upload max 10 images
- [ ] Try to upload 11th image (should fail)
- [ ] View on mobile device (responsive)
- [ ] Close and reopen dialog (state persists)

---

## Screenshots (What It Looks Like)

### Dashboard View
```
┌─────────────────────────────────────────┐
│  [Starred Image - Large Display]       │
│  ⭐ Hovedbilde    [3 bilder]           │
│  [Administrer bilder button on hover]  │
└─────────────────────────────────────────┘

┌──────┬──────┬──────┬──────┐
│ Img2 │ Img3 │ Img4 │ +2   │  ← Thumbnails
└──────┴──────┴──────┴──────┘
```

### Management Dialog
```
┌────────────────────────────────────────┐
│  Administrer bilder              [X]   │
├────────────────────────────────────────┤
│  3 av 10 bilder    ⭐ Hovedbilde valgt│
│                                         │
│  ┌─────────┬─────────┐                │
│  │ Image 1 │ Image 2 │                │
│  │ ⭐ ⭐   │ ⭐ 🗑️  │ ← Action buttons │
│  │ [Caption] [Caption]│                │
│  └─────────┴─────────┘                │
│  ┌─────────┐                           │
│  │ Image 3 │                           │
│  │ ⭐ 🗑️  │                           │
│  │ [Caption]                           │
│  └─────────┘                           │
│                                         │
│  [+ Legg til flere bilder (7 igjen)]  │
│                                         │
│                         [Ferdig]       │
└────────────────────────────────────────┘
```

---

## Backward Compatibility

✅ **Fully backward compatible!**
- Old completions with single image work perfectly
- Migration auto-converted single images to multi-image structure
- All existing starred images preserved
- No data loss

---

## Future Enhancements (Optional)

Ideas for future improvements:
- [ ] Drag-and-drop reordering in UI (API already supports it)
- [ ] Image cropping tool
- [ ] Filters or effects
- [ ] Side-by-side image comparison
- [ ] Image zoom/lightbox view
- [ ] Bulk caption editing
- [ ] Image analytics (views per image)

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify database migration applied successfully
3. Check that all images are accessible
4. Ensure user has proper permissions
5. Review `/MULTI_IMAGE_IMPLEMENTATION.md` for more details

---

## Summary

You've now upgraded your dashboard to support full multi-image management! Users can:
- Upload up to 10 images per completion
- Choose which one is their "hovedbilde" (contest entry)
- Add captions to tell stories about each image
- Delete images they don't want
- All with a beautiful, intuitive interface

**Ready to use!** 🚀

Just change the import in `/app/dashboard/page.tsx` and you're done!
