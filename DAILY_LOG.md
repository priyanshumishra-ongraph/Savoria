# Daily Log

## Day 9: Ratings, Reviews & In-Browser AI
**What I built:**
- Integrated a fully functional Ratings & Reviews system for recipes.
- Created robust MongoDB aggregation pipelines ($facet) to synchronize a recipe's averageRating and reviewCount instantly upon review creation or deletion.
- Developed an interactive frontend UI allowing users to vote reviews as "Helpful" and allowing recipe authors to post official replies.
- Integrated two in-browser AI models using Web Workers: Sentiment Analysis (Transformers.js) and Toxicity Detection (TensorFlow.js) to automatically tag and moderate user reviews without blocking the main UI thread.

**What I learned:**
- Running heavy ML models (Xenova/distilbert and @tensorflow-models/toxicity) directly on the main thread freezes the Angular UI. I learned how to offload model downloading and inference to a background Web Worker.
- Using await tf.setBackend('cpu') is necessary in Web Workers when WebGL is unavailable or causes crashes during HMR reloads.
- Handling race conditions in MongoDB when computing averages (e.g., handling the case where a recipe's last review is deleted so it doesn't return NaN).

**Where I used AI tools:**
- Used AI to help structure the MongoDB $facet aggregation pipeline for highly performant, single-query rating recalculations.
- Used AI to debug WebGL initialization errors in the Web Worker when loading the TensorFlow toxicity model.


## Day 10: Favourites and Collections
**What I built:**
- Integrated TensorFlow.js MobileNet directly into the recipe upload form to classify images locally before upload. If the image isn't recognized as food, it shows a helpful warning banner.
- Upgraded the Favorites system: Added a 1-click "Heart" button to recipe cards that automatically provisions and syncs a "Favorites" Cookbook in the user's collections.
- Added dynamic, animated Toast notifications for favoriting recipes, using Angular's `ChangeDetectorRef` to ensure the animations trigger properly inside RxJS subscriptions.
- Patched a major privacy leak by stripping user emails out of the MongoDB `.populate()` calls for Collaborators.
- Fixed complex CSS layout bugs, ensuring the profile dropdown avatar displays perfectly on mobile navbars, and ensuring fallback placeholder images load cleanly if Unsplash URLs are blocked.

**What I learned:**
- Angular's change detection can sometimes lose track of `setTimeout` calls when they are triggered inside an asynchronous `HttpClient` observable (due to zone execution contexts). Manually calling `this.cdr.detectChanges()` forces the DOM update.
- Mongoose `.populate()` calls should always restrict fields explicitly (e.g. `'name avatarUrl'`) to prevent PII (Personally Identifiable Information) like emails from silently leaking to the frontend.
- When an `<img>` tag's `(error)` handler assigns a fallback URL, you must set `img.onerror = null` to prevent infinite looping if the fallback URL also fails to load.

**Where I used AI tools:**
- Used AI to analyze and patch the broken mobile CSS layout on the navbar.
- Used AI to rapidly wire up the backend Favourites API to the frontend Recipe Cards.
- Collaborated with AI to architect the auto-provisioning "Favourites" Cookbook system.
- Used AI to correctly inject Angular's ChangeDetectorRef for fixing the CSS transition timings on the toast popups.

## Day 11: Search, Semantic AI & UI Polish
**What I built:**
- Upgraded the MongoDB backend with weighted text search (prioritizing titles and tags) and strict $all array matching for ingredients.
- Refactored the frontend SearchService to use a centralized BehaviorSubject and switchMap RxJS pipeline, eliminating duplicate API calls on fast typing.
- Built a rich "Cook with what I have" filtering UI with an interactive ingredient chip picker, cook time slider, and sort bars.
- Added a Smart "Similar Recipes as Recommended for You" section that offloads AI Semantic Re-ranking (cosine similarity via @xenova/transformers) to a background Web Worker.
- Integrated the Web Speech API for hands-free voice searching directly inside the search bar.

**What I learned:**
- Using async/await and resolving promises inside an Angular 
gOnChanges hook can throw ExpressionChangedAfterItHasBeenCheckedError (NG0100) if DOM elements are updated asynchronously. I learned to manually trigger ChangeDetectorRef to sync the state.
- Transformers.js Web Workers will attempt to load local ONNX models by default, which causes Protobuf parsing crashes if the dev server responds with a fallback index.html. Setting env.allowLocalModels = false forces it to pull securely from the HuggingFace CDN.

**Where I used AI tools:**
- Used AI to orchestrate the complex Web Worker messaging for client-side semantic re-ranking.
- Used AI to deeply analyze and patch NG0100 and Protobuf loading crashes in the UI.
- Used AI to architect a robust, fully-passing 47-test suite to secure the backend API and fix rogue database collection bugs.
