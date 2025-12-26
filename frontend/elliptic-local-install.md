# Installing Elliptic.js Locally (Fallback Solution)

If CDN loading fails, you can install elliptic.js locally:

## Option 1: Download and Include Locally

1. Download elliptic.min.js from:
   - https://unpkg.com/elliptic@6.5.4/dist/elliptic.min.js
   - Or: https://github.com/indutny/elliptic/releases

2. Save it in the `frontend/` directory as `elliptic.min.js`

3. Update `index.html` to use local file:
   ```html
   <script src="elliptic.min.js"></script>
   ```

## Option 2: Use npm (if using build tools)

```bash
npm install elliptic
```

Then bundle it with your build tool.

## Option 3: Manual CDN Download

1. Open browser
2. Navigate to: https://unpkg.com/elliptic@6.5.4/dist/elliptic.min.js
3. Save the file as `elliptic.min.js` in `frontend/` directory
4. Update HTML to use local file

