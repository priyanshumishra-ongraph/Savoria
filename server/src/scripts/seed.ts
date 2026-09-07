import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../models/Recipe';
import User from '../models/User';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const recipesData = [
  {
    title: "Classic Avocado Toast",
    description: "A quick, nutritious, and absolutely delicious breakfast. Crispy artisanal bread topped with creamy, perfectly seasoned avocado, a hint of lime juice, and a sprinkle of red pepper flakes for that extra kick to start your day right.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&q=80",
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    category: "Breakfast",
    tags: ["healthy", "vegan", "quick", "breakfast"],
    ingredients: [
      { name: "Sourdough Bread", quantity: "2 slices" },
      { name: "Ripe Avocado", quantity: "1 large" },
      { name: "Lime Juice", quantity: "1 tbsp" },
      { name: "Salt", quantity: "To taste" },
      { name: "Black Pepper", quantity: "To taste" },
      { name: "Red Pepper Flakes", quantity: "1/2 tsp" },
      { name: "Extra Virgin Olive Oil", quantity: "1 tsp" }
    ],
    steps: [
      "Toast the sourdough bread slices until golden and crispy.",
      "Cut the avocado in half, remove the pit, and scoop the flesh into a bowl.",
      "Add lime juice, salt, and pepper to the avocado and mash with a fork until desired consistency.",
      "Spread the mashed avocado evenly over the toasted bread.",
      "Drizzle with a little olive oil and sprinkle red pepper flakes on top.",
      "Serve immediately and enjoy!"
    ]
  },
  {
    title: "Hearty Beef Stew",
    description: "The ultimate comfort food for cold evenings. This slow-cooked, rich, and savory beef stew features tender chunks of beef, wholesome root vegetables, and a deep, flavorful broth enhanced with red wine and fresh herbs.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1548943487-a2e4e43b4850?w=800&q=80",
    prepTimeMinutes: 20,
    cookTimeMinutes: 120,
    category: "Dinner",
    tags: ["comfort food", "beef", "stew", "dinner"],
    ingredients: [
      { name: "Beef Chuck Roast", quantity: "2 lbs, cubed" },
      { name: "Carrots", quantity: "4 large, chopped" },
      { name: "Potatoes", quantity: "3 large, cubed" },
      { name: "Onion", quantity: "1 large, diced" },
      { name: "Garlic", quantity: "4 cloves, minced" },
      { name: "Beef Broth", quantity: "4 cups" },
      { name: "Red Wine", quantity: "1 cup" },
      { name: "Tomato Paste", quantity: "2 tbsp" },
      { name: "Fresh Thyme", quantity: "2 sprigs" },
      { name: "Olive Oil", quantity: "2 tbsp" }
    ],
    steps: [
      "Heat olive oil in a large pot over medium-high heat. Sear the beef chunks until browned on all sides, then remove and set aside.",
      "In the same pot, sauté onions and garlic until softened.",
      "Stir in the tomato paste and cook for 1 minute.",
      "Pour in the red wine to deglaze the pot, scraping up any browned bits from the bottom.",
      "Return the beef to the pot and add the beef broth, thyme, carrots, and potatoes.",
      "Bring to a boil, then reduce the heat to low, cover, and simmer for about 2 hours, or until the beef is very tender.",
      "Season with salt and pepper to taste before serving hot."
    ]
  },
  {
    title: "Mango Sticky Rice",
    description: "A classic Thai dessert that perfectly balances sweet, salty, and creamy flavors. Warm, sticky glutinous rice is steeped in sweetened coconut milk and served alongside freshly sliced, juicy ripe mangoes. A true tropical delight.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1605333396914-2314d2089b09?w=800&q=80",
    prepTimeMinutes: 30,
    cookTimeMinutes: 25,
    category: "Dessert",
    tags: ["thai", "dessert", "mango", "sweet"],
    ingredients: [
      { name: "Glutinous Rice", quantity: "1 cup" },
      { name: "Coconut Milk", quantity: "1.5 cups" },
      { name: "Sugar", quantity: "1/3 cup" },
      { name: "Salt", quantity: "1/2 tsp" },
      { name: "Ripe Mangoes", quantity: "2 large" },
      { name: "Toasted Sesame Seeds", quantity: "1 tbsp" }
    ],
    steps: [
      "Soak the glutinous rice in water for at least 4 hours, preferably overnight.",
      "Drain the rice and steam it in a bamboo steamer or regular steamer for about 20-25 minutes until tender and translucent.",
      "While the rice steams, combine coconut milk, sugar, and salt in a saucepan. Heat gently until the sugar completely dissolves, but do not let it boil.",
      "Transfer the cooked hot rice into a bowl and pour the warm coconut milk mixture over it. Stir well, cover, and let it sit for 20 minutes to absorb the liquid.",
      "Peel and slice the mangoes.",
      "Serve the sweet sticky rice on a plate, top with sliced mango, and garnish with toasted sesame seeds."
    ]
  },
  {
    title: "Refreshing Matcha Latte",
    description: "An energizing and vibrant beverage made with premium grade matcha green tea powder and perfectly frothed milk. This latte offers a beautiful earthy flavor profile with a touch of natural sweetness, providing a smooth, sustained energy boost.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1515823064-d6e0c04616a4?w=800&q=80",
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    category: "Beverage",
    tags: ["drink", "matcha", "morning", "energy"],
    ingredients: [
      { name: "Matcha Powder", quantity: "1 tsp" },
      { name: "Hot Water (Not boiling)", quantity: "2 oz" },
      { name: "Milk of choice", quantity: "1 cup" },
      { name: "Honey or Maple Syrup", quantity: "1-2 tsp" }
    ],
    steps: [
      "Sift the matcha powder into a mug or small bowl to prevent clumps.",
      "Add the hot (but not boiling) water and whisk vigorously using a bamboo whisk or milk frother until the matcha is fully dissolved and slightly frothy.",
      "Stir in the honey or maple syrup to sweeten.",
      "Warm the milk and froth it using a frother or by shaking vigorously in a jar.",
      "Gently pour the frothed milk over the matcha mixture.",
      "Dust with a tiny pinch of extra matcha powder for presentation."
    ]
  },
  {
    title: "Spicy Tuna Poke Bowl",
    description: "A vibrant, Hawaiian-inspired dish featuring fresh sushi-grade tuna tossed in a savory and spicy sesame-soy marinade. Served over a bed of fluffy rice and accompanied by crisp vegetables, creamy avocado, and a sprinkle of seaweed.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    category: "Lunch",
    tags: ["hawaiian", "seafood", "healthy", "bowl"],
    ingredients: [
      { name: "Sushi-grade Tuna", quantity: "1 lb, cubed" },
      { name: "Soy Sauce", quantity: "3 tbsp" },
      { name: "Sesame Oil", quantity: "1 tbsp" },
      { name: "Sriracha", quantity: "1 tbsp" },
      { name: "Sushi Rice", quantity: "2 cups, cooked" },
      { name: "Avocado", quantity: "1, sliced" },
      { name: "Cucumber", quantity: "1/2, diced" },
      { name: "Edamame", quantity: "1/2 cup, shelled" },
      { name: "Green Onions", quantity: "2, sliced" },
      { name: "Sesame Seeds", quantity: "1 tbsp" }
    ],
    steps: [
      "In a medium bowl, whisk together the soy sauce, sesame oil, and sriracha.",
      "Add the cubed tuna and green onions to the marinade. Toss gently to coat and let it sit in the refrigerator for 15 minutes.",
      "Divide the warm sushi rice into serving bowls.",
      "Top the rice with the marinated spicy tuna.",
      "Arrange the sliced avocado, cucumber, and edamame beautifully around the tuna.",
      "Garnish the entire bowl with sesame seeds and extra green onions before serving."
    ]
  },
  {
    title: "Classic Spaghetti Carbonara",
    description: "An authentic Italian pasta dish originating from Rome. This incredibly creamy and rich recipe requires no cream, relying entirely on a masterfully emulsified sauce of eggs, hard Pecorino Romano cheese, crispy guanciale, and starchy pasta water.",
    difficulty: "Hard",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80",
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    category: "Dinner",
    tags: ["italian", "pasta", "classic", "dinner"],
    ingredients: [
      { name: "Spaghetti", quantity: "400g" },
      { name: "Guanciale or Pancetta", quantity: "150g, diced" },
      { name: "Pecorino Romano", quantity: "1 cup, finely grated" },
      { name: "Large Eggs", quantity: "3 whole, 1 yolk" },
      { name: "Black Pepper", quantity: "1 tbsp, freshly cracked" },
      { name: "Salt", quantity: "For pasta water" }
    ],
    steps: [
      "Bring a large pot of salted water to a boil. Add the spaghetti and cook until al dente.",
      "While the pasta cooks, crisp the guanciale in a large skillet over medium heat until the fat renders and the meat is golden. Turn off the heat.",
      "In a bowl, vigorously whisk the eggs, grated Pecorino Romano, and a generous amount of black pepper until it forms a thick paste.",
      "When the pasta is ready, reserve 1 cup of pasta water, then drain the spaghetti.",
      "Immediately transfer the hot spaghetti to the skillet with the guanciale. Toss well off the heat.",
      "Quickly pour the egg and cheese mixture over the pasta, tossing rapidly to create a creamy sauce. Add splashes of reserved pasta water as needed to achieve the perfect silky consistency.",
      "Serve immediately, topped with extra cheese and black pepper."
    ]
  },
  {
    title: "Homemade Granola Bars",
    description: "Healthy, chewy, and easily customizable snack bars packed with oats, nuts, and natural sweetness. Perfect for on-the-go breakfasts or midday energy boosts. Far superior and fresher than store-bought alternatives.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&q=80",
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    category: "Snack",
    tags: ["snack", "healthy", "baking", "meal-prep"],
    ingredients: [
      { name: "Rolled Oats", quantity: "2.5 cups" },
      { name: "Almonds", quantity: "1/2 cup, chopped" },
      { name: "Honey", quantity: "1/3 cup" },
      { name: "Peanut Butter", quantity: "1/4 cup" },
      { name: "Vanilla Extract", quantity: "1 tsp" },
      { name: "Chocolate Chips", quantity: "1/4 cup" },
      { name: "Salt", quantity: "1/4 tsp" }
    ],
    steps: [
      "Preheat your oven to 350°F (175°C) and line an 8x8 inch baking pan with parchment paper.",
      "Spread the oats and almonds on a baking sheet and toast in the oven for 10 minutes, stirring halfway.",
      "In a small saucepan, combine the honey, peanut butter, and vanilla extract. Heat gently until well combined and smooth.",
      "In a large bowl, mix the toasted oats and almonds with the salt. Pour the wet mixture over the dry ingredients and stir until evenly coated.",
      "Let the mixture cool slightly, then fold in the chocolate chips.",
      "Transfer the mixture to the prepared baking pan, pressing down very firmly to compact it.",
      "Chill in the refrigerator for at least 2 hours before lifting out and cutting into bars."
    ]
  },
  {
    title: "Crispy Falafel Wrap",
    description: "A fantastic Middle Eastern street food experience at home. Warm pita bread stuffed with golden, herb-packed crispy falafels, fresh crunchy vegetables, and generously drizzled with a smooth, tangy tahini sauce.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800&q=80",
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    category: "Lunch",
    tags: ["vegan", "middle-eastern", "wrap", "lunch"],
    ingredients: [
      { name: "Dried Chickpeas", quantity: "1 cup (soaked overnight)" },
      { name: "Fresh Parsley", quantity: "1/2 cup" },
      { name: "Fresh Cilantro", quantity: "1/2 cup" },
      { name: "Onion", quantity: "1/2, chopped" },
      { name: "Garlic", quantity: "4 cloves" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Coriander", quantity: "1 tsp" },
      { name: "Pita Bread", quantity: "4 rounds" },
      { name: "Tahini Sauce", quantity: "1/2 cup" },
      { name: "Lettuce, Tomato, Cucumber", quantity: "For serving" }
    ],
    steps: [
      "Drain the soaked chickpeas thoroughly.",
      "In a food processor, combine the chickpeas, parsley, cilantro, onion, garlic, cumin, coriander, and a pinch of salt. Pulse until the mixture resembles coarse sand.",
      "Transfer to a bowl and refrigerate for 1 hour to help the mixture hold together.",
      "Form the mixture into small patties or balls.",
      "Heat oil in a deep frying pan to 350°F (175°C). Fry the falafels in batches until deep golden brown and crispy, about 4-5 minutes.",
      "Warm the pita breads, then stuff them with the crispy falafels, fresh veggies, and drizzle generously with tahini sauce."
    ]
  },
  {
    title: "Blueberry Ricotta Pancakes",
    description: "Light, incredibly fluffy pancakes enriched with creamy ricotta cheese and bursting with juicy fresh blueberries. A touch of lemon zest elevates the flavor, making this a luxurious weekend breakfast treat.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&q=80",
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    category: "Breakfast",
    tags: ["breakfast", "sweet", "pancakes", "berries"],
    ingredients: [
      { name: "All-Purpose Flour", quantity: "1.5 cups" },
      { name: "Baking Powder", quantity: "2 tsp" },
      { name: "Sugar", quantity: "3 tbsp" },
      { name: "Ricotta Cheese", quantity: "1 cup" },
      { name: "Milk", quantity: "3/4 cup" },
      { name: "Eggs", quantity: "2 large, separated" },
      { name: "Lemon Zest", quantity: "1 tbsp" },
      { name: "Fresh Blueberries", quantity: "1 cup" },
      { name: "Butter", quantity: "For cooking" }
    ],
    steps: [
      "In a large bowl, whisk together the flour, baking powder, and sugar.",
      "In a separate bowl, mix the ricotta, milk, egg yolks, and lemon zest.",
      "In a third, clean bowl, beat the egg whites until stiff peaks form.",
      "Gently fold the wet ricotta mixture into the dry ingredients until just combined.",
      "Carefully fold in the beaten egg whites, followed by the blueberries, being careful not to overmix.",
      "Melt a small amount of butter on a griddle or skillet over medium heat.",
      "Pour 1/4 cup of batter per pancake and cook until bubbles form on the surface, then flip and cook until golden brown.",
      "Serve hot with maple syrup."
    ]
  },
  {
    title: "Grilled Lemon Herb Chicken",
    description: "A bright, zesty, and lean protein main dish. Chicken breasts are marinated in a vibrant blend of fresh herbs, garlic, and bright lemon juice, then grilled to juicy perfection with a gorgeous char.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=800&q=80",
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    category: "Dinner",
    tags: ["chicken", "healthy", "grill", "dinner"],
    ingredients: [
      { name: "Chicken Breasts", quantity: "4 boneless, skinless" },
      { name: "Olive Oil", quantity: "1/4 cup" },
      { name: "Lemon Juice", quantity: "3 tbsp" },
      { name: "Garlic", quantity: "3 cloves, minced" },
      { name: "Fresh Rosemary", quantity: "1 tbsp, chopped" },
      { name: "Fresh Thyme", quantity: "1 tbsp, chopped" },
      { name: "Salt and Pepper", quantity: "To taste" }
    ],
    steps: [
      "In a small bowl, whisk together olive oil, lemon juice, garlic, rosemary, thyme, salt, and pepper.",
      "Place the chicken breasts in a ziplock bag or shallow dish and pour the marinade over them.",
      "Seal or cover and marinate in the refrigerator for at least 30 minutes, or up to 4 hours.",
      "Preheat your grill to medium-high heat. Oil the grates lightly.",
      "Remove chicken from the marinade and discard the excess liquid.",
      "Grill the chicken for 6-8 minutes per side, or until the internal temperature reaches 165°F (74°C).",
      "Let the chicken rest for 5 minutes before slicing and serving."
    ]
  },
  {
    title: "Classic Tiramisu",
    description: "An elegant and deeply satisfying Italian dessert. Layers of delicate ladyfinger biscuits soaked in strong espresso and a touch of liqueur, alternating with a rich, ethereal mascarpone cream, finished with a dusting of cocoa powder.",
    difficulty: "Hard",
    imageUrl: "https://images.unsplash.com/photo-1571115177098-24de4d372fde?w=800&q=80",
    prepTimeMinutes: 45,
    cookTimeMinutes: 0,
    category: "Dessert",
    tags: ["italian", "dessert", "coffee", "baking"],
    ingredients: [
      { name: "Mascarpone Cheese", quantity: "16 oz (room temp)" },
      { name: "Eggs", quantity: "4 large, separated" },
      { name: "Sugar", quantity: "1/2 cup" },
      { name: "Strong Espresso", quantity: "1.5 cups, cooled" },
      { name: "Coffee Liqueur (Kahlua)", quantity: "3 tbsp" },
      { name: "Ladyfingers (Savoiardi)", quantity: "24-30 pieces" },
      { name: "Cocoa Powder", quantity: "For dusting" }
    ],
    steps: [
      "In a large bowl, beat the egg yolks with half of the sugar until pale and thick. Gently mix in the mascarpone cheese until perfectly smooth.",
      "In a separate impeccably clean bowl, beat the egg whites until soft peaks form. Gradually add the remaining sugar and beat until stiff, glossy peaks form.",
      "Gently fold the egg whites into the mascarpone mixture in three additions to keep the cream light and airy.",
      "Combine the cooled espresso and coffee liqueur in a shallow dish.",
      "Quickly dip each ladyfinger into the coffee mixture (do not soak, just a quick dip) and arrange a tight layer in the bottom of a 9x13 inch dish.",
      "Spread half of the mascarpone cream over the ladyfingers.",
      "Repeat with a second layer of dipped ladyfingers and top with the remaining cream. Smooth the top.",
      "Cover and refrigerate for at least 6 hours, preferably overnight, to allow the flavors to meld and set.",
      "Dust generously with cocoa powder just before serving."
    ]
  },
  {
    title: "Watermelon Feta Mint Salad",
    description: "The absolute perfect summer salad. A breathtakingly refreshing combination of sweet, juicy watermelon cubes, salty crumbled feta cheese, and fragrant fresh mint, brought together with a bright lime vinaigrette.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=800&q=80",
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    category: "Lunch",
    tags: ["salad", "summer", "refreshing", "vegetarian"],
    ingredients: [
      { name: "Watermelon", quantity: "4 cups, cubed" },
      { name: "Feta Cheese", quantity: "1 cup, crumbled" },
      { name: "Fresh Mint Leaves", quantity: "1/2 cup, roughly chopped" },
      { name: "Red Onion", quantity: "1/4 cup, very thinly sliced" },
      { name: "Extra Virgin Olive Oil", quantity: "2 tbsp" },
      { name: "Lime Juice", quantity: "1 tbsp" },
      { name: "Balsamic Glaze", quantity: "Optional, for drizzling" }
    ],
    steps: [
      "In a large serving bowl, combine the cubed watermelon and thinly sliced red onion.",
      "In a small bowl, whisk together the olive oil and lime juice.",
      "Pour the dressing over the watermelon and gently toss to coat.",
      "Sprinkle the crumbled feta cheese and chopped mint over the top.",
      "Gently fold once or twice to distribute, being careful not to crush the watermelon or turn the cheese pink.",
      "Drizzle with a touch of balsamic glaze if desired, and serve immediately chilled."
    ]
  },
  {
    title: "Homemade Iced Chai Latte",
    description: "A wonderfully spiced and cooling beverage that rivals any coffee shop. Brewed black tea infused with aromatic cardamom, cinnamon, ginger, and cloves, sweetened lightly and poured over ice with creamy milk.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1557008130-18dc0c33a25b?w=800&q=80",
    prepTimeMinutes: 5,
    cookTimeMinutes: 20,
    category: "Beverage",
    tags: ["drink", "tea", "spiced", "iced"],
    ingredients: [
      { name: "Water", quantity: "2 cups" },
      { name: "Black Tea Bags", quantity: "4" },
      { name: "Cinnamon Sticks", quantity: "2" },
      { name: "Cardamom Pods", quantity: "6, crushed" },
      { name: "Fresh Ginger", quantity: "1 inch piece, sliced" },
      { name: "Whole Cloves", quantity: "4" },
      { name: "Brown Sugar", quantity: "2-3 tbsp" },
      { name: "Milk", quantity: "2 cups" },
      { name: "Ice", quantity: "For serving" }
    ],
    steps: [
      "In a saucepan, bring the water, cinnamon sticks, crushed cardamom, ginger, and cloves to a boil.",
      "Reduce the heat, cover, and let it simmer gently for 15 minutes to extract the deep spice flavors.",
      "Remove from heat, add the black tea bags, and steep for 5 minutes.",
      "Remove the tea bags and stir in the brown sugar until fully dissolved.",
      "Strain the concentrated chai syrup into a jar and let it cool completely in the refrigerator.",
      "To serve, fill a tall glass with ice. Fill halfway with the chilled chai concentrate, and top the rest of the way with milk. Stir and enjoy."
    ]
  },
  {
    title: "Baked Salmon with Asparagus",
    description: "A healthy, quick, and vibrant weeknight dinner prepared entirely on one sheet pan. Flaky, omega-3 rich salmon fillets are roasted alongside crisp-tender asparagus spears, all kissed with lemon and garlic butter.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&q=80",
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    category: "Dinner",
    tags: ["seafood", "healthy", "sheet-pan", "dinner"],
    ingredients: [
      { name: "Salmon Fillets", quantity: "4 (6 oz each)" },
      { name: "Fresh Asparagus", quantity: "1 bunch, ends trimmed" },
      { name: "Olive Oil", quantity: "2 tbsp" },
      { name: "Butter", quantity: "2 tbsp, melted" },
      { name: "Garlic", quantity: "3 cloves, minced" },
      { name: "Lemon", quantity: "1, sliced" },
      { name: "Fresh Dill", quantity: "1 tbsp, chopped" },
      { name: "Salt and Pepper", quantity: "To taste" }
    ],
    steps: [
      "Preheat your oven to 400°F (200°C) and line a large baking sheet with parchment paper.",
      "Toss the trimmed asparagus in olive oil, salt, and pepper, and arrange them on one side of the pan.",
      "Place the salmon fillets on the other side of the pan. Season them with salt and pepper.",
      "In a small bowl, mix the melted butter and minced garlic, then brush it generously over the salmon fillets.",
      "Top each salmon fillet with a slice of lemon.",
      "Bake for 12-15 minutes, until the salmon is opaque and flakes easily with a fork, and the asparagus is tender.",
      "Garnish with fresh dill before serving."
    ]
  },
  {
    title: "Roasted Red Pepper Hummus",
    description: "A vibrant, smoky twist on classic hummus. Sweet roasted red peppers are blended with protein-packed chickpeas, tahini, and garlic to create a deeply flavorful, silky smooth dip perfect for pita or veggies.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=800&q=80",
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    category: "Snack",
    tags: ["dip", "vegan", "healthy", "snack"],
    ingredients: [
      { name: "Canned Chickpeas", quantity: "1 can (15 oz), drained and rinsed" },
      { name: "Roasted Red Peppers", quantity: "1 cup (jarred or freshly roasted)" },
      { name: "Tahini", quantity: "1/4 cup" },
      { name: "Lemon Juice", quantity: "3 tbsp" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Olive Oil", quantity: "2 tbsp" },
      { name: "Cumin", quantity: "1/2 tsp" },
      { name: "Smoked Paprika", quantity: "1/2 tsp" },
      { name: "Salt", quantity: "To taste" }
    ],
    steps: [
      "In a food processor, combine the tahini and lemon juice. Process for 1 minute to whip the tahini and make it ultra-creamy.",
      "Add the olive oil, minced garlic, cumin, smoked paprika, and salt to the processor. Process for another 30 seconds.",
      "Add half of the chickpeas and process for 1 minute. Scrape the sides of the bowl, then add the remaining chickpeas and process until thick and quite smooth.",
      "Add the roasted red peppers and continue to process for 1-2 minutes until the hummus reaches your desired silky consistency. Add 1-2 tbsp of water if it seems too thick.",
      "Transfer to a serving bowl, create a swirl on top, and drizzle with a little extra olive oil and a dash of paprika.",
      "Serve with warm pita wedges or fresh vegetable sticks."
    ]
  },
  {
    title: "Caprese Panini",
    description: "A magnificent hot sandwich that brings the flavors of Italy to your lunch hour. Crusty ciabatta bread filled with thick slices of fresh mozzarella, ripe juicy tomatoes, and vibrant basil pesto, pressed until golden and melty.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80",
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    category: "Lunch",
    tags: ["sandwich", "italian", "vegetarian", "lunch"],
    ingredients: [
      { name: "Ciabatta Rolls", quantity: "2" },
      { name: "Fresh Mozzarella", quantity: "8 oz, sliced thickly" },
      { name: "Tomato", quantity: "1 large, sliced thickly" },
      { name: "Fresh Basil Pesto", quantity: "3 tbsp" },
      { name: "Balsamic Glaze", quantity: "1 tbsp" },
      { name: "Olive Oil", quantity: "1 tbsp" }
    ],
    steps: [
      "Slice the ciabatta rolls in half horizontally.",
      "Spread a generous layer of fresh basil pesto on the bottom half of each roll.",
      "Layer the thick slices of fresh mozzarella cheese over the pesto.",
      "Top the cheese with the thick tomato slices.",
      "Drizzle the balsamic glaze over the tomatoes and place the top half of the roll on the sandwich.",
      "Brush the outside top and bottom of the bread lightly with olive oil.",
      "Heat a panini press or a heavy skillet over medium heat. Place the sandwiches on the heat.",
      "Cook for 4-5 minutes, pressing down firmly with a spatula or heavy pan, until the bread is deeply golden, crispy, and the cheese has melted beautifully.",
      "Slice diagonally and serve immediately."
    ]
  },
  {
    title: "Chocolate Lava Cakes",
    description: "The ultimate impressive yet surprisingly easy dessert. Individual cakes with a delicate, cakey exterior that open to reveal a warm, molten, rich chocolate center. Best served immediately with a scoop of vanilla ice cream.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80",
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    category: "Dessert",
    tags: ["chocolate", "baking", "dessert", "indulgent"],
    ingredients: [
      { name: "High-Quality Dark Chocolate", quantity: "6 oz, chopped" },
      { name: "Butter", quantity: "1/2 cup (1 stick)" },
      { name: "Eggs", quantity: "2 whole + 2 yolks" },
      { name: "Sugar", quantity: "1/4 cup" },
      { name: "Vanilla Extract", quantity: "1 tsp" },
      { name: "All-Purpose Flour", quantity: "2 tbsp" },
      { name: "Powdered Sugar", quantity: "For dusting" }
    ],
    steps: [
      "Preheat your oven to 425°F (220°C). Generously butter four ramekins and dust them lightly with flour or cocoa powder, tapping out the excess.",
      "Place the chopped chocolate and butter in a microwave-safe bowl. Microwave in 20-second bursts, stirring in between, until completely melted and smooth.",
      "In a separate bowl, whisk the eggs, egg yolks, sugar, and vanilla together until light and thick.",
      "Gently fold the melted chocolate mixture into the egg mixture until well combined.",
      "Sprinkle the flour over the batter and gently fold it in just until it disappears. Do not overmix.",
      "Divide the batter evenly among the prepared ramekins.",
      "Bake for exactly 11-13 minutes. The edges should be firm, but the center will still be slightly jiggly.",
      "Let them sit for 1 minute, then carefully invert each ramekin onto a dessert plate.",
      "Dust with powdered sugar and serve immediately."
    ]
  },
  {
    title: "Shakshuka",
    description: "A wonderfully flavorful and deeply satisfying dish of eggs poached in a robust, spiced sauce of tomatoes, bell peppers, onions, and garlic. Perfect for breakfast, brunch, or even a comforting dinner, served with plenty of crusty bread to soak up the sauce.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80",
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    category: "Breakfast",
    tags: ["eggs", "middle-eastern", "brunch", "one-pan"],
    ingredients: [
      { name: "Olive Oil", quantity: "2 tbsp" },
      { name: "Onion", quantity: "1 medium, diced" },
      { name: "Red Bell Pepper", quantity: "1, diced" },
      { name: "Garlic", quantity: "3 cloves, minced" },
      { name: "Canned Crushed Tomatoes", quantity: "1 large can (28 oz)" },
      { name: "Paprika", quantity: "1 tsp" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Chili Powder", quantity: "1/4 tsp" },
      { name: "Eggs", quantity: "5-6 large" },
      { name: "Fresh Cilantro or Parsley", quantity: "For garnish" }
    ],
    steps: [
      "Heat olive oil in a large, deep skillet over medium heat. Add the diced onion and red bell pepper, cooking until softened, about 5-7 minutes.",
      "Stir in the minced garlic, paprika, cumin, and chili powder. Cook for 1 minute until fragrant.",
      "Pour in the crushed tomatoes and bring the mixture to a gentle simmer. Reduce heat to low and let it simmer for 10-15 minutes, allowing the sauce to thicken slightly and flavors to meld.",
      "Use the back of a spoon to make small wells in the sauce. Carefully crack an egg into each well.",
      "Cover the skillet and simmer for 5-8 minutes, or until the egg whites are set but the yolks are still runny (or cook longer to your preference).",
      "Remove from heat, garnish generously with fresh cilantro or parsley, and serve immediately right from the pan with crusty bread."
    ]
  },
  {
    title: "Teriyaki Glazed Salmon",
    description: "A savory, sweet, and sticky teriyaki glaze heavily coats tender, flaky salmon fillets in this quick weeknight dinner. Paired beautifully with steamed rice and a side of quick-wilted greens.",
    difficulty: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=800&q=80",
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    category: "Dinner",
    tags: ["salmon", "japanese", "seafood", "quick-dinner"],
    ingredients: [
      { name: "Salmon Fillets", quantity: "4 (6 oz each)" },
      { name: "Soy Sauce", quantity: "1/3 cup" },
      { name: "Mirin (or Rice Vinegar + Sugar)", quantity: "1/4 cup" },
      { name: "Sake", quantity: "2 tbsp" },
      { name: "Sugar", quantity: "2 tbsp" },
      { name: "Fresh Ginger", quantity: "1 tsp, grated" },
      { name: "Oil", quantity: "1 tbsp" },
      { name: "Sesame Seeds and Scallions", quantity: "For garnish" }
    ],
    steps: [
      "In a small bowl, whisk together the soy sauce, mirin, sake, sugar, and grated ginger to create the teriyaki sauce.",
      "Heat the oil in a large non-stick skillet over medium-high heat. Season the salmon lightly with salt.",
      "Place the salmon fillets in the skillet, skin-side down, and cook for 4-5 minutes until the skin is crispy.",
      "Carefully flip the salmon and cook for 1 more minute.",
      "Pour the teriyaki sauce into the skillet. Let it bubble and reduce, spooning the thickening sauce over the salmon fillets continuously.",
      "Cook for another 2-3 minutes until the salmon is cooked through and heavily glazed with the shiny, sticky sauce.",
      "Transfer the salmon to serving plates, drizzle any remaining sauce from the pan over the top, and garnish with sesame seeds and sliced scallions."
    ]
  },
  {
    title: "Classic Lemonade",
    description: "The quintessential thirst quencher. The perfect ratio of freshly squeezed tart lemon juice, homemade simple syrup for balanced sweetness, and cold water. So simple, but undeniably better than any mix.",
    difficulty: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80",
    prepTimeMinutes: 15,
    cookTimeMinutes: 5,
    category: "Beverage",
    tags: ["drink", "lemon", "summer", "refreshing"],
    ingredients: [
      { name: "Fresh Lemons", quantity: "5-6 (yielding 1 cup juice)" },
      { name: "Granulated Sugar", quantity: "1 cup" },
      { name: "Water (for syrup)", quantity: "1 cup" },
      { name: "Cold Water", quantity: "3 to 4 cups, to taste" },
      { name: "Ice", quantity: "Plenty, for serving" }
    ],
    steps: [
      "First, make a simple syrup by combining the sugar and 1 cup of water in a small saucepan. Heat over medium, stirring frequently, until the sugar is completely dissolved. Let it cool.",
      "While the syrup cools, juice the lemons to yield 1 full cup of fresh lemon juice.",
      "In a large pitcher, combine the cooled simple syrup, the fresh lemon juice, and 3 to 4 cups of cold water (depending on how strong you like it).",
      "Stir well to combine.",
      "Refrigerate until very cold.",
      "Serve over glasses filled to the brim with ice, garnished with a lemon wheel."
    ]
  }
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const user =
      (await User.findOne({ role: 'admin' }).sort({ _id: 1 })) ??
      (await User.findOne().sort({ _id: 1 }));

    if (!user) {
      console.error('No user found. Please create at least one user before seeding.');
      process.exit(1);
    }

    console.log(`Seeding recipes as: ${user.name} (${user.email}, role: ${user.role})`);

    const deleted = await Recipe.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing recipe(s).`);

    const toSlug = (title: string) =>
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const recipesToInsert = recipesData.map(recipe => ({
      ...recipe,
      owner: user._id,
      slug: toSlug(recipe.title),
    }));

    await Recipe.insertMany(recipesToInsert);
    console.log(`Successfully seeded ${recipesToInsert.length} recipes.`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seedDatabase();
