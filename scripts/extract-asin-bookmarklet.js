/**
 * Amazon ASIN Extractor Bookmarklet
 * 
 * HOW TO USE:
 * 1. Open Amazon search results page (from your app's "Buy on Amazon" link)
 * 2. Find the exact product in the results (should be first with our optimized search)
 * 3. Click the product to open its page
 * 4. Copy this entire script
 * 5. Create a new bookmark in your browser
 * 6. Paste this as the URL (replace the bookmark URL with this code)
 * 7. When on an Amazon product page, click the bookmark
 * 8. It will copy the ASIN to your clipboard and show it in an alert
 * 
 * OR use this in browser console:
 */

javascript:(function(){
  // Extract ASIN from URL
  const urlMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
  if (urlMatch) {
    const asin = urlMatch[1];
    navigator.clipboard.writeText(asin).then(() => {
      alert('ASIN copied to clipboard: ' + asin);
    });
    return;
  }
  
  // Try to find ASIN in page source
  const pageText = document.body.innerText;
  const asinMatch = pageText.match(/ASIN[:\s]+([A-Z0-9]{10})/i);
  if (asinMatch) {
    const asin = asinMatch[1];
    navigator.clipboard.writeText(asin).then(() => {
      alert('ASIN found and copied: ' + asin);
    });
    return;
  }
  
  alert('ASIN not found. Make sure you are on an Amazon product page.');
})();

