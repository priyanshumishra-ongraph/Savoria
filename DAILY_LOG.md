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

## Day 12: Real-time Notifications & Settings
**What I built:**
- Built a comprehensive real-time notification system supporting 4 distinct events: Reviews, Saves (Collections), Replies, and Helpful Votes.
- Integrated Socket.IO for real-time pushing and MongoDB for persistent notification storage.
- Engineered a "Notification Grouping" backend utility that prevents spam by grouping unread notifications for the same recipe (e.g., "John Doe and 4 others saved your recipe").
- Created a robust frontend UI dropdown with Unread/All tabs, recipe image thumbnails, "Mark all read" capabilities, and inline delete buttons.
- Implemented cursor-based pagination for the notifications feed to preserve performance.
- Added a Notifications Preferences page allowing users to opt-out of specific notification types, properly synced to their MongoDB profile.
- Added comprehensive E2E testing using Supertest to guarantee the lifecycle of notifications (ensuring 53/53 tests passed).

**What I learned:**
- When updating MongoDB arrays inside `findOneAndUpdate`, checking the `returnDocument: 'after'` option is critical when you need to send a notification containing the most up-to-date document state.
- Structuring Socket.IO connections in Angular requires cleaning up event listeners during component teardown to prevent memory leaks and duplicate signals.
- In-place grouping of notifications via `$inc` and `$set` using Mongoose allows you to keep an unread notification fresh at the top of the feed without clogging the database with hundreds of individual rows.

**Where I used AI tools:**
- Paired with AI to design the schema architecture for grouped notifications.

## Day 13: Meal Planner & Smart Shopping List
**What I built:**
- Built an interactive Weekly Meal Planner grid allowing users to schedule Breakfast, Lunch, Dinner, Snacks, and more using an Angular Material interface.
- Developed a Smart Shopping List that automatically aggregates all ingredients from scheduled recipes for the week, merging identical items and normalizing quantities.
- Created a robust quantity parser that intelligently extracts numbers and units from complex, unstructured ingredient strings (e.g., "1 (15 oz) can", "1-2 lbs").
- Applied a comprehensive Savoria-branded UI overhaul to the planner, utilizing warm gradients, custom active tab indicators, and aesthetic grid borders.
- Engineered a pristine PDF Export/Print view that hides browser headers, forces brand color printing, and injects precise top/bottom page margins using HTML spacers.

**What I learned:**
- Template functions in Angular (e.g., *ngIf="getMeal(day, type)") run on every change detection cycle, causing severe (N)$ performance bottlenecks. I learned to pre-compute an (1)$ Map lookup table in the component class to eliminate render lag.
- Angular singleton services can easily cause memory leaks if components subscribe to their Observables without implementing ngOnDestroy to clean up the subscriptions.

### 🚀 Day 14: Snap & Cook (AI Recipe OCR) & CI/CD Pipeline (Completed)

- **Snap & Cook (AI Scanner)**: Implemented an entirely in-browser OCR scanner using Tesseract.js WebAssembly. Users can snap a photo of a physical recipe card or cookbook page, and the AI instantly transcribes and auto-fills the Angular reactive recipe form.
- **Automated Text Parsing**: Engineered a smart heuristic parser that scans raw OCR text to intelligently differentiate between Titles, Ingredients (detecting measurements), and Cooking Steps.
- **GitHub Actions CI Pipeline**: Built an automated continuous integration pipeline (.github/workflows/ci.yml) that validates the build, runs the headless Angular frontend tests, and spins up an in-memory MongoDB container to execute all 53 backend API tests via Jest & Supertest upon every push.
- **Real Angular Unit Tests**: Replaced scaffolded Jasmine specs with fully functional TestBed unit tests for the Meal Planner feature, mocking services, testing component interactions, and ensuring robust lookup mapping.

## 🤖 In-Browser AI Add-ons for Day 14
1. **Snap & Cook Optical Character Recognition (OCR)**
   - **Model**: Tesseract.js (WebAssembly-based eng.traineddata).
   - **What it does**: Runs a highly accurate machine learning OCR model entirely locally inside the user's browser, respecting privacy while perfectly translating photos of text into digital recipes without calling external paid APIs.

