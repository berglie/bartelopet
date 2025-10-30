# Testing Guide - Security Features

**Your dev server is running at:** http://localhost:3001

---

## ✅ Quick Test Checklist

### 1. Verify Redis Connection

**Check the server logs for:**

```bash
# Look for this message (good):
✅ No "[Rate Limit] Redis credentials not found" message

# If you see this (bad):
❌ [Rate Limit] Redis credentials not found. Rate limiting disabled.
```

**How to check:**
- Look at your terminal where `npm run dev` is running
- If you see no Redis error, it's working! ✅

**If Redis is NOT connected:**
1. Check `.env.local` has:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```
2. Restart dev server: `npm run dev`

---

### 2. Test Rate Limiting (OAuth Endpoint)

**Test:** Try to access the OAuth endpoint multiple times

```bash
# Run this command 6 times quickly:
curl http://localhost:3001/api/vipps/authorize
```

**Expected Result:**
- First 5 requests: Should work (may get config error - that's OK)
- 6th request: Should get **429 Too Many Requests**

**If you get 429 on 6th request:** ✅ Rate limiting is working!

**Response should look like:**
```json
{
  "error": "For mange forsøk. Prøv igjen senere."
}
```

---

### 3. Test File Upload Security

**Option A: Using the Web Interface**

1. Go to http://localhost:3001
2. Log in (or register)
3. Try to upload an image

**Test Cases:**

✅ **Valid Image (Should Work):**
- Upload a normal JPEG, PNG, or WebP image < 10MB
- Should upload successfully

❌ **Oversized File (Should Fail):**
- Try to upload an image > 10MB
- Should get error: "Filen er for stor"

❌ **Non-Image File (Should Fail):**
- Try to rename a `.txt` file to `.jpg` and upload it
- Should get error: "Ugyldig bildefil"

❌ **Malicious File (Should Fail):**
- Try to upload an SVG file
- Should get error: "Ugyldig format: svg"

**Option B: Using Command Line**

```bash
# Create a test file that's too large
dd if=/dev/zero of=large.jpg bs=1M count=15

# Try to upload it through your app
# Should be rejected with "File too large" error
```

---

### 4. Test Comment Rate Limiting

1. Go to any completion page in the gallery
2. Try to add 21 comments rapidly

**Expected Result:**
- First 20 comments: Should work
- 21st comment: Should get error: "For mange kommentarer. Prøv igjen om X minutter"

If you get rate limited: ✅ Comment rate limiting works!

---

### 5. Test Upload Rate Limiting

1. Try to upload 11 images in one hour

**Expected Result:**
- First 10 uploads: Should work
- 11th upload: Should get error: "For mange opplastinger"

If you get rate limited: ✅ Upload rate limiting works!

---

### 6. Test Security Headers

**Check CSP is Active:**

```bash
curl -I http://localhost:3001
```

**Look for these headers:**
```
Content-Security-Policy: default-src 'self'; script-src ...
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
Strict-Transport-Security: max-age=63072000
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
```

If you see these headers: ✅ Security headers are active!

---

### 7. Test Error Sanitization

**Try to trigger an error:**

1. Go to a non-existent completion: http://localhost:3001/galleri/nonexistent-id
2. Check the error message

**Expected:**
- Should show generic user-friendly error
- Should NOT show database schema details
- Should NOT show "table not found" or SQL errors

**Good Error Messages:**
- ✅ "En feil oppstod. Prøv igjen senere."
- ✅ "Finner ikke det du leter etter."

**Bad Error Messages (Should NOT see):**
- ❌ "relation public.completions does not exist"
- ❌ "violates foreign key constraint"
- ❌ Stack traces with file paths

---

## 🧪 Advanced Testing

### Test File Validation Deep Dive

**Create test files:**

```bash
# 1. Create a text file disguised as image
echo "This is not an image" > fake.jpg

# 2. Create an HTML file disguised as image
echo "<html><script>alert('XSS')</script></html>" > xss.jpg

# 3. Create an SVG with embedded script
cat > malicious.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg">
  <script>alert('XSS')</script>
</svg>
EOF
```

**Try to upload each file:**
- All should be rejected with "Ugyldig bildefil" or "Ugyldig format"
- None should reach the storage bucket

**Verify in Supabase:**
- Go to Supabase → Storage → completion-photos
- Check that NO fake files were uploaded
- Only valid JPEG files should appear

---

### Monitor Rate Limiting in Real-Time

**Check Upstash Dashboard:**

1. Go to https://console.upstash.com
2. Click on your database
3. Go to "Data Browser"
4. Look for keys like:
   - `ratelimit:oauth:*`
   - `ratelimit:upload:*`
   - `ratelimit:comment:*`

**If you see these keys:** ✅ Rate limiting is being tracked!

**Each key shows:**
- Number of requests made
- Time until reset
- Remaining quota

---

### Test OAuth Security

**New User Registration:**

1. Create a new Vipps user (if you have access to Vipps test environment)
2. Check the Supabase auth users table
3. Verify the password is NOT the Vipps `sub`

**How to check:**
- Go to Supabase → Authentication → Users
- Find your new user
- The password should be a long random hex string (NOT a predictable UUID)

---

## 🔍 What to Look For in Logs

**Good Logs (Everything Working):**

```
✓ Ready in 1081ms
[Security] User attempted action: addComment
[Rate Limit] Check passed for user: abc123
[File Validation] Image validated successfully: 1920x1080px, 2.3MB
```

**Warning Logs (Potential Issues):**

```
⚠ [Rate Limit] Redis credentials not found. Rate limiting disabled.
⚠ [File Validation] Rejected file: too large (15MB)
⚠ [Security Error] Unauthorized access attempt blocked
```

**Error Logs (Need Attention):**

```
❌ [Rate Limit] Failed to connect to Redis
❌ [File Validation] Sharp processing failed
❌ [Supabase Error] Database connection timeout
```

---

## 📊 Performance Testing

### Load Test Rate Limiting

```bash
# Install Apache Bench (if not installed)
# On macOS: brew install httpd
# On Ubuntu: sudo apt-get install apache2-utils

# Test OAuth endpoint with 100 requests
ab -n 100 -c 10 http://localhost:3001/api/vipps/authorize

# Check how many got rate limited
# Should see mix of 200s and 429s
```

**Expected Results:**
- First ~5-10 requests: 200 OK
- Remaining requests: 429 Too Many Requests
- Average response time: < 100ms

---

## ✅ Pre-Deployment Checklist

Before deploying to Vercel:

- [ ] ✅ Redis connection working (no "credentials not found" error)
- [ ] ✅ Rate limiting triggers after threshold (tested with curl)
- [ ] ✅ File uploads work for valid images
- [ ] ✅ Oversized files are rejected
- [ ] ✅ Non-image files are rejected
- [ ] ✅ SVG files are rejected
- [ ] ✅ Security headers present in response
- [ ] ✅ Error messages are sanitized (no database schema leaks)
- [ ] ✅ Comment rate limiting works
- [ ] ✅ Upload rate limiting works
- [ ] ✅ OAuth login works (if using Vipps)
- [ ] ✅ Maps display correctly (Mapbox)
- [ ] ✅ Mobile responsive design works
- [ ] ✅ Build succeeds (`npm run build`)

---

## 🚀 Deployment Steps

Once all tests pass:

### 1. Commit Changes

```bash
git add .
git commit -m "security: implement comprehensive security fixes"
git push
```

### 2. Configure Vercel Environment Variables

Go to Vercel → Your Project → Settings → Environment Variables

**Add these for ALL environments (Production, Preview, Development):**

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Verify existing variables are set:**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_MAPBOX_TOKEN
- VIPPS_CLIENT_ID (if using)
- VIPPS_CLIENT_SECRET (if using)
- VIPPS_REDIRECT_URI (if using)

### 3. Deploy

```bash
# Trigger deployment
git push

# Or manually in Vercel dashboard:
# Deployments → Redeploy
```

### 4. Test Production

After deployment:

```bash
# Test rate limiting on production
curl https://your-app.vercel.app/api/vipps/authorize

# Do this 6 times quickly - 6th should get 429
```

### 5. Monitor

**First 24 Hours:**
- Watch Vercel logs for errors
- Check Upstash dashboard for rate limit activity
- Monitor Supabase storage for unusual uploads

**First Week:**
- Review rate limit patterns
- Adjust limits if needed
- Check for any false positives

---

## 🆘 Troubleshooting

### Rate Limiting Not Working

**Symptom:** Can make unlimited requests

**Solutions:**
1. Check `.env.local` has Redis credentials
2. Verify Redis credentials in Upstash dashboard
3. Check server logs for "[Rate Limit] Redis credentials not found"
4. Restart dev server
5. Try in incognito/private window (clear cache)

### File Uploads Failing

**Symptom:** All uploads fail with "Invalid image"

**Solutions:**
1. Check Sharp is installed: `npm list sharp`
2. Try reinstalling: `npm install sharp`
3. Check file format is JPEG/PNG/WebP
4. Verify file is under 10MB
5. Check server logs for Sharp errors

### Redis Connection Errors

**Symptom:** "Failed to connect to Redis"

**Solutions:**
1. Verify Redis credentials are correct
2. Check Upstash database is active (not paused)
3. Check your IP isn't blocked by Upstash
4. Try creating a new database in Upstash

### CSP Blocking Resources

**Symptom:** Browser console shows CSP violations

**Solutions:**
1. Identify blocked resource domain
2. Add domain to CSP in `next.config.js`
3. Rebuild: `npm run build`
4. Clear browser cache

---

## 📞 Getting Help

If you encounter issues:

1. **Check server logs** in terminal
2. **Check browser console** (F12)
3. **Review Vercel logs** (if deployed)
4. **Check Upstash dashboard** for Redis activity
5. **Check Supabase logs** for database errors

**Common Issues & Solutions:**
- Rate limit not working → Redis not configured
- File upload fails → Sharp not installed or wrong format
- CSP errors → Resource domain not whitelisted
- 429 on first request → Rate limit threshold too low

---

**Last Updated:** 2025-10-30
**Dev Server:** http://localhost:3001
**Redis Status:** Check logs for confirmation
