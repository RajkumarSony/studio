// src/lib/translations.ts

export type LanguageCode = 'en' | 'hi' | 'bn' | 'mr' | 'ta' | 'te' | 'or' | 'pa' | 'ja' | 'es' | 'fr';

interface TranslationMessages {
  appTitle: string;
  loadingMessage: string;
  quickModePreference: string;
  servingSizePreference: string; // Use {count} placeholder
  languageSelector: {
    ariaLabel: string;
    placeholder: string;
    tooltip: string;
  };
  themeSelector: {
    ariaLabel: string;
    tooltip: string;
    light: string;
    dark: string;
    system: string;
  };
  hero: {
    title: string;
    subtitle: string;
  };
  form: {
    title: string;
    description: string;
    ingredientsLabel: string;
    ingredientsPlaceholder: string;
    ingredientsError: string;
    dietaryRestrictionsLabel: string;
    dietaryRestrictionsPlaceholder: string;
    preferencesLabel: string;
    preferencesPlaceholder: string;
    quickModeLabel: string;
    quickModeHint: string;
    quickModeAriaLabel: string;
    servingSizeLabel: string;
    servingSizePlaceholder: string;
    cuisineTypeLabel: string; // New field
    cuisineTypePlaceholder: string; // New field
    cookingMethodLabel: string; // New field
    cookingMethodPlaceholder: string; // New field
    includeDetailsLabel: string; // New field
    includeDetailsHint: string; // New field
    includeDetailsAriaLabel: string; // New field
    submitButton: string;
    submitButtonLoading: string;
    resetButton: string;
    footerNote: string;
  };
  results: {
    title: string;
    imageAlt: string; // Use {recipeName} placeholder
    saveButtonAriaLabel: string;
    saveButtonTooltip: string;
    ingredientsTitle: string;
    instructionsTitle: string;
    noRecipesFoundTitle: string;
    noRecipesFoundSuggestion: string;
    defaultDescription: string; // New fallback description
    viewRecipeButton: string; // New button text
  };
  recipeDetail: { // New section for detail page
    backButton: string;
    nutritionTitle: string;
    dietPlanTitle: string;
    nutritionPlaceholder: string;
    dietPlanPlaceholder: string;
    ingredientsPlaceholder: string;
    instructionsPlaceholder: string;
    imagePromptLabel: string;
    errorLoadingTitle: string; // New error title
    errorLoadingMessage: string; // New error message
  };
  toast: {
    formClearedTitle: string;
    formClearedDesc: string;
    recipeSavedTitle: string;
    recipeSavedDesc: string; // Use {recipeName} placeholder
    noRecipesTitle: string;
    noRecipesDesc: string;
    recipesFoundTitle: string;
    recipesFoundDesc: string; // Use {count} and {s} placeholders
    errorTitle: string;
    genericError: string; // Default error if specific message isn't available
    validationError: string; // Error for form validation issues
  };
  footer: {
    builtWith: string; // Includes "Built with ❤️ by "
    poweredBy: string;
    copyright: string; // Use {year} placeholder
  };
}

// Type assertion for better type checking
export const translations: Record<LanguageCode, TranslationMessages> = {
  en: {
    appTitle: 'RecipeSage',
    loadingMessage: 'Generating delicious ideas...',
    quickModePreference: 'quick meal (under 30 minutes)',
    servingSizePreference: 'serves {count}',
    languageSelector: {
      ariaLabel: 'Select language',
      placeholder: 'Language',
      tooltip: 'Select Language',
    },
    themeSelector: {
      ariaLabel: 'Toggle theme',
      tooltip: 'Change Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    hero: {
      title: 'Unlock Your Inner Chef!',
      subtitle: 'Enter ingredients you have, add preferences, and let RecipeSage find your next delicious meal, tailored just for you.',
    },
    form: {
      title: 'Find Recipes',
      description: 'Tell us what you have and what you like. We\'ll handle the rest!',
      ingredientsLabel: 'Available Ingredients',
      ingredientsPlaceholder: 'e.g., chicken breast, broccoli, soy sauce, rice, garlic...',
      ingredientsError: 'Please enter at least a few ingredients.',
      dietaryRestrictionsLabel: 'Dietary Restrictions',
      dietaryRestrictionsPlaceholder: 'e.g., vegetarian, gluten-free',
      preferencesLabel: 'Other Preferences',
      preferencesPlaceholder: 'e.g., spicy, Italian cuisine, healthy',
      quickModeLabel: 'Quick Mode?',
      quickModeHint: '(Under 30 min)',
      quickModeAriaLabel: 'Quick mode (under 30 minutes)',
      servingSizeLabel: 'Servings',
      servingSizePlaceholder: 'e.g., 2',
      cuisineTypeLabel: 'Cuisine Type', // New field
      cuisineTypePlaceholder: 'e.g., Indian, Mexican, Thai', // New field
      cookingMethodLabel: 'Cooking Method', // New field
      cookingMethodPlaceholder: 'e.g., baking, stir-fry, grilling', // New field
      includeDetailsLabel: 'Include Details?',
      includeDetailsHint: '(Nutrition/Diet)',
      includeDetailsAriaLabel: 'Include nutrition facts and diet plan suitability',
      submitButton: 'Get Suggestions',
      submitButtonLoading: 'Finding Recipes...',
      resetButton: 'Clear Form',
      footerNote: 'AI generates suggestions based on your input. Results may vary. Double-check allergies!',
    },
    results: {
      title: 'Your Recipe Suggestions',
      imageAlt: 'Generated image for {recipeName}',
      saveButtonAriaLabel: 'Save recipe',
      saveButtonTooltip: 'Save Recipe',
      ingredientsTitle: 'Ingredients',
      instructionsTitle: 'Instructions',
      noRecipesFoundTitle: 'No recipes found matching your criteria.',
      noRecipesFoundSuggestion: 'Try adjusting your ingredients or preferences for better luck!',
      defaultDescription: 'A delicious recipe suggestion based on your ingredients.',
      viewRecipeButton: 'View Recipe',
    },
     recipeDetail: {
       backButton: 'Back to Suggestions',
       nutritionTitle: 'Nutrition Facts (Estimated)',
       dietPlanTitle: 'Diet Plan Suitability',
       nutritionPlaceholder: 'Nutrition information will appear here if available.',
       dietPlanPlaceholder: 'Diet plan suitability information will appear here if available.',
       ingredientsPlaceholder: 'No ingredients listed.',
       instructionsPlaceholder: 'No instructions available.',
       imagePromptLabel: 'Image Prompt',
       errorLoadingTitle: 'Error Loading Recipe',
       errorLoadingMessage: 'Could not load the details for this recipe. It might be missing or the link might be incorrect.',
     },
    toast: {
      formClearedTitle: 'Form Cleared',
      formClearedDesc: 'Ready for new ingredients!',
      recipeSavedTitle: 'Recipe Saved!',
      recipeSavedDesc: '{recipeName} has been added to your favorites (simulation).',
      noRecipesTitle: 'No Recipes Found',
      noRecipesDesc: 'Couldn\'t find any recipes with the given ingredients and preferences. Try adjusting your input.',
      recipesFoundTitle: 'Recipes Found!',
      recipesFoundDesc: 'We found {count} recipe suggestion{s} for you.',
      errorTitle: 'Error',
      genericError: 'Failed to suggest recipes. Please try again later.',
      validationError: 'Input validation failed. Please check your entries.',
    },
    footer: {
      builtWith: 'Built with ❤️ by ',
      poweredBy: 'Powered by Gemini.',
      copyright: '© {year} RecipeSage. All rights reserved (not really).',
    },
  },
  hi: {
    appTitle: 'रेसिपीसेज',
    loadingMessage: 'स्वादिष्ट विचार उत्पन्न हो रहे हैं...',
    quickModePreference: 'त्वरित भोजन (30 मिनट से कम)',
    servingSizePreference: '{count} लोगों के लिए',
    languageSelector: {
      ariaLabel: 'भाषा चुनें',
      placeholder: 'भाषा',
      tooltip: 'भाषा चुनें',
    },
    themeSelector: {
      ariaLabel: 'थीम टॉगल करें',
      tooltip: 'थीम बदलें',
      light: 'लाइट',
      dark: 'डार्क',
      system: 'सिस्टम',
    },
    hero: {
      title: 'अपने अंदर के शेफ को अनलॉक करें!',
      subtitle: 'आपके पास मौजूद सामग्री दर्ज करें, प्राथमिकताएं जोड़ें, और रेसिपीसेज को अपना अगला स्वादिष्ट भोजन ढूंढने दें, जो सिर्फ आपके लिए तैयार किया गया हो।',
    },
    form: {
      title: 'रेसिपी खोजें',
      description: 'हमें बताएं कि आपके पास क्या है और आपको क्या पसंद है। बाकी हम संभाल लेंगे!',
      ingredientsLabel: 'उपलब्ध सामग्री',
      ingredientsPlaceholder: 'जैसे, चिकन ब्रेस्ट, ब्रोकली, सोया सॉस, चावल, लहसुन...',
      ingredientsError: 'कृपया कम से कम कुछ सामग्री दर्ज करें।',
      dietaryRestrictionsLabel: 'आहार संबंधी प्रतिबंध',
      dietaryRestrictionsPlaceholder: 'जैसे, शाकाहारी, ग्लूटेन-मुक्त',
      preferencesLabel: 'अन्य प्राथमिकताएँ',
      preferencesPlaceholder: 'जैसे, मसालेदार, इतालवी व्यंजन, स्वस्थ',
      quickModeLabel: 'त्वरित मोड?',
      quickModeHint: '(30 मिनट से कम)',
      quickModeAriaLabel: 'त्वरित मोड (30 मिनट से कम)',
      servingSizeLabel: 'सर्विंग्स',
      servingSizePlaceholder: 'जैसे, 2',
      cuisineTypeLabel: 'व्यंजन प्रकार', // New field
      cuisineTypePlaceholder: 'जैसे, भारतीय, मैक्सिकन, थाई', // New field
      cookingMethodLabel: 'खाना पकाने की विधि', // New field
      cookingMethodPlaceholder: 'जैसे, बेकिंग, स्टिर-फ्राई, ग्रिलिंग', // New field
      includeDetailsLabel: 'विवरण शामिल करें?',
      includeDetailsHint: '(पोषण/आहार)',
      includeDetailsAriaLabel: 'पोषण तथ्य और आहार योजना उपयुक्तता शामिल करें',
      submitButton: 'सुझाव प्राप्त करें',
      submitButtonLoading: 'रेसिपी ढूंढी जा रही हैं...',
      resetButton: 'फॉर्म साफ़ करें',
      footerNote: 'AI आपके इनपुट के आधार पर सुझाव उत्पन्न करता है। परिणाम भिन्न हो सकते हैं। एलर्जी की दोबारा जाँच करें!',
    },
    results: {
      title: 'आपके रेसिपी सुझाव',
      imageAlt: '{recipeName} के लिए उत्पन्न छवि',
      saveButtonAriaLabel: 'रेसिपी सहेजें',
      saveButtonTooltip: 'रेसिपी सहेजें',
      ingredientsTitle: 'सामग्री',
      instructionsTitle: 'निर्देश',
      noRecipesFoundTitle: 'आपके मानदंडों से मेल खाने वाली कोई रेसिपी नहीं मिली।',
      noRecipesFoundSuggestion: 'बेहतर भाग्य के लिए अपनी सामग्री या प्राथमिकताओं को समायोजित करने का प्रयास करें!',
      defaultDescription: 'आपकी सामग्री के आधार पर एक स्वादिष्ट रेसिपी सुझाव।',
      viewRecipeButton: 'रेसिपी देखें',
    },
    recipeDetail: {
      backButton: 'सुझावों पर वापस जाएं',
      nutritionTitle: 'पोषण तथ्य (अनुमानित)',
      dietPlanTitle: 'आहार योजना उपयुक्तता',
      nutritionPlaceholder: 'पोषण जानकारी उपलब्ध होने पर यहाँ दिखाई देगी।',
      dietPlanPlaceholder: 'आहार योजना उपयुक्तता जानकारी उपलब्ध होने पर यहाँ दिखाई देगी।',
      ingredientsPlaceholder: 'कोई सामग्री सूचीबद्ध नहीं है।',
      instructionsPlaceholder: 'कोई निर्देश उपलब्ध नहीं है।',
      imagePromptLabel: 'छवि प्रॉम्प्ट',
      errorLoadingTitle: 'रेसिपी लोड करने में त्रुटि',
      errorLoadingMessage: 'इस रेसिपी का विवरण लोड नहीं किया जा सका। यह गुम हो सकता है या लिंक गलत हो सकता है।',
    },
    toast: {
      formClearedTitle: 'फॉर्म साफ़ किया गया',
      formClearedDesc: 'नई सामग्री के लिए तैयार!',
      recipeSavedTitle: 'रेसिपी सहेजी गई!',
      recipeSavedDesc: '{recipeName} को आपके पसंदीदा में जोड़ा गया है (सिमुलेशन)।',
      noRecipesTitle: 'कोई रेसिपी नहीं मिली',
      noRecipesDesc: 'दी गई सामग्री और प्राथमिकताओं के साथ कोई रेसिपी नहीं मिल सकी। अपना इनपुट समायोजित करने का प्रयास करें।',
      recipesFoundTitle: 'रेसिपी मिलीं!',
      recipesFoundDesc: 'हमें आपके लिए {count} रेसिपी सुझाव मिले हैं।',
      errorTitle: 'त्रुटि',
      genericError: 'रेसिपी सुझाने में विफल। कृपया बाद में पुनः प्रयास करें।',
      validationError: 'इनपुट सत्यापन विफल रहा। कृपया अपनी प्रविष्टियाँ जांचें।',
    },
    footer: {
      builtWith: '❤️ द्वारा निर्मित ',
      poweredBy: 'जेमिनी द्वारा संचालित।',
      copyright: '© {year} रेसिपीसेज। सर्वाधिकार सुरक्षित (वास्तव में नहीं)।',
    },
  },
  bn: {
    appTitle: 'রেসিপিসেজ',
    loadingMessage: 'সুস্বাদু ধারণা তৈরি হচ্ছে...',
    quickModePreference: 'দ্রুত খাবার (30 মিনিটের কম)',
    servingSizePreference: '{count} জনের জন্য',
    languageSelector: {
        ariaLabel: 'ভাষা নির্বাচন করুন',
        placeholder: 'ভাষা',
        tooltip: 'ভাষা নির্বাচন করুন',
    },
    themeSelector: {
        ariaLabel: 'থিম পরিবর্তন করুন',
        tooltip: 'থিম পরিবর্তন করুন',
        light: 'লাইট',
        dark: 'ডার্ক',
        system: 'সিস্টেম',
    },
    hero: {
        title: 'আপনার ভেতরের শেফকে আনলক করুন!',
        subtitle: 'আপনার কাছে থাকা উপকরণ লিখুন, পছন্দ যোগ করুন, এবং রেসিপিসেজকে আপনার পরবর্তী সুস্বাদু খাবার খুঁজে পেতে দিন, শুধুমাত্র আপনার জন্য তৈরি।',
    },
    form: {
        title: 'রেসিপি খুঁজুন',
        description: 'আমাদের বলুন আপনার কাছে কি আছে এবং আপনি কি পছন্দ করেন। বাকিটা আমরা সামলে নেব!',
        ingredientsLabel: 'উপলব্ধ উপকরণ',
        ingredientsPlaceholder: 'যেমন, মুরগির বুকের মাংস, ব্রোকলি, সয়া সস, ভাত, রসুন...',
        ingredientsError: 'অনুগ্রহ করে অন্তত কিছু উপকরণ লিখুন।',
        dietaryRestrictionsLabel: 'খাদ্যতালিকাগত বিধিনিষেধ',
        dietaryRestrictionsPlaceholder: 'যেমন, নিরামিষ, গ্লুটেন-মুক্ত',
        preferencesLabel: 'অন্যান্য পছন্দ',
        preferencesPlaceholder: 'যেমন, মশলাদার, ইতালীয় রান্না, স্বাস্থ্যকর',
        quickModeLabel: 'দ্রুত মোড?',
        quickModeHint: '(৩০ মিনিটের নিচে)',
        quickModeAriaLabel: 'দ্রুত মোড (৩০ মিনিটের নিচে)',
        servingSizeLabel: 'পরিবেশন সংখ্যা',
        servingSizePlaceholder: 'যেমন, ২',
        cuisineTypeLabel: 'রন্ধনশৈলী', // New field
        cuisineTypePlaceholder: 'যেমন, ভারতীয়, মেক্সিকান, থাই', // New field
        cookingMethodLabel: 'রান্নার পদ্ধতি', // New field
        cookingMethodPlaceholder: 'যেমন, বেকিং, স্টার-ফ্রাই, গ্রিলিং', // New field
        includeDetailsLabel: 'বিস্তারিত অন্তর্ভুক্ত?',
        includeDetailsHint: '(পুষ্টি/খাদ্য)',
        includeDetailsAriaLabel: 'পুষ্টি তথ্য এবং খাদ্য পরিকল্পনার উপযুক্ততা অন্তর্ভুক্ত করুন',
        submitButton: 'পরামর্শ পান',
        submitButtonLoading: 'রেসিপি খোঁজা হচ্ছে...',
        resetButton: 'ফর্ম পরিষ্কার করুন',
        footerNote: 'AI আপনার ইনপুটের উপর ভিত্তি করে পরামর্শ তৈরি করে। ফলাফল ভিন্ন হতে পারে। অ্যালার্জি ডাবল-চেক করুন!',
    },
    results: {
        title: 'আপনার রেসিপি পরামর্শ',
        imageAlt: '{recipeName} এর জন্য জেনারেট করা ছবি',
        saveButtonAriaLabel: 'রেসিপি সংরক্ষণ করুন',
        saveButtonTooltip: 'রেসিপি সংরক্ষণ করুন',
        ingredientsTitle: 'উপকরণ',
        instructionsTitle: 'নির্দেশাবলী',
        noRecipesFoundTitle: 'আপনার মানদণ্ডের সাথে মিলে যাওয়া কোনও রেসিপি পাওয়া যায়নি।',
        noRecipesFoundSuggestion: 'আরও ভাল ফলাফলের জন্য আপনার উপকরণ বা পছন্দগুলি সামঞ্জস্য করার চেষ্টা করুন!',
        defaultDescription: 'আপনার উপকরণের উপর ভিত্তি করে একটি সুস্বাদু রেসিপি পরামর্শ।',
        viewRecipeButton: 'রেসিপি দেখুন',
    },
    recipeDetail: {
       backButton: 'পরামর্শে ফিরে যান',
       nutritionTitle: 'পুষ্টি তথ্য (আনুমানিক)',
       dietPlanTitle: 'খাদ্য পরিকল্পনার উপযুক্ততা',
       nutritionPlaceholder: 'পুষ্টির তথ্য উপলব্ধ থাকলে এখানে দেখা যাবে।',
       dietPlanPlaceholder: 'খাদ্য পরিকল্পনার উপযুক্ততার তথ্য উপলব্ধ থাকলে এখানে দেখা যাবে।',
       ingredientsPlaceholder: 'কোন উপকরণ তালিকাভুক্ত নেই।',
       instructionsPlaceholder: 'কোনো নির্দেশনা উপলব্ধ নেই।',
       imagePromptLabel: 'চিত্র প্রম্পট',
       errorLoadingTitle: 'রেসিপি লোড করতে ত্রুটি',
       errorLoadingMessage: 'এই রেসিপির বিবরণ লোড করা যায়নি। এটি অনুপস্থিত থাকতে পারে বা লিঙ্কটি ভুল হতে পারে।',
     },
    toast: {
        formClearedTitle: 'ফর্ম পরিষ্কার করা হয়েছে',
        formClearedDesc: 'নতুন উপকরণের জন্য প্রস্তুত!',
        recipeSavedTitle: 'রেসিপি সংরক্ষিত হয়েছে!',
        recipeSavedDesc: '{recipeName} আপনার পছন্দের তালিকায় যুক্ত করা হয়েছে (সিমুলেশন)।',
        noRecipesTitle: 'কোনও রেসিপি পাওয়া যায়নি',
        noRecipesDesc: 'প্রদত্ত উপকরণ এবং পছন্দগুলির সাথে কোনও রেসিপি খুঁজে পাওয়া যায়নি। আপনার ইনপুট সামঞ্জস্য করার চেষ্টা করুন।',
        recipesFoundTitle: 'রেসিপি পাওয়া গেছে!',
        recipesFoundDesc: 'আমরা আপনার জন্য {count}টি রেসিপি পরামর্শ খুঁজে পেয়েছি।',
        errorTitle: 'ত্রুটি',
        genericError: 'রেসিপি পরামর্শ দিতে ব্যর্থ হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
        validationError: 'ইনপুট যাচাইকরণ ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার এন্ট্রি চেক করুন।',
    },
    footer: {
        builtWith: '❤️ দিয়ে তৈরি ',
        poweredBy: 'জেমিনি দ্বারা চালিত।',
        copyright: '© {year} রেসিপিসেজ। সর্বস্বত্ব সংরক্ষিত (আসলে নয়)।',
    },
  },
  mr: {
      appTitle: 'रेसिपीसेज',
      loadingMessage: 'स्वादिष्ट कल्पना तयार होत आहेत...',
      quickModePreference: 'झटपट जेवण (30 मिनिटांपेक्षा कमी)',
      servingSizePreference: '{count} लोकांसाठी',
      languageSelector: {
          ariaLabel: 'भाषा निवडा',
          placeholder: 'भाषा',
          tooltip: 'भाषा निवडा',
      },
      themeSelector: {
          ariaLabel: 'थीम टॉगल करा',
          tooltip: 'थीम बदला',
          light: 'लाईट',
          dark: 'डार्क',
          system: 'सिस्टम',
      },
      hero: {
          title: 'तुमच्यातील शेफला अनलॉक करा!',
          subtitle: 'तुमच्याकडे असलेले साहित्य प्रविष्ट करा, प्राधान्ये जोडा आणि रेसिपीसेजला तुमचे पुढील स्वादिष्ट जेवण शोधू द्या, जे फक्त तुमच्यासाठी तयार केले आहे.',
      },
      form: {
          title: 'रेसिपी शोधा',
          description: 'तुमच्याकडे काय आहे आणि तुम्हाला काय आवडते ते आम्हाला सांगा. बाकी आम्ही सांभाळू!',
          ingredientsLabel: 'उपलब्ध साहित्य',
          ingredientsPlaceholder: 'उदा. चिकन ब्रेस्ट, ब्रोकोली, सोया सॉस, तांदूळ, लसूण...',
          ingredientsError: 'कृपया किमान काही साहित्य प्रविष्ट करा.',
          dietaryRestrictionsLabel: 'आहारविषयक निर्बंध',
          dietaryRestrictionsPlaceholder: 'उदा. शाकाहारी, ग्लूटेन-मुक्त',
          preferencesLabel: 'इतर प्राधान्ये',
          preferencesPlaceholder: 'उदा. मसालेदार, इटालियन पाककृती, निरोगी',
          quickModeLabel: 'झटपट मोड?',
          quickModeHint: '(३० मिनिटांपेक्षा कमी)',
          quickModeAriaLabel: 'झटपट मोड (३० मिनिटांपेक्षा कमी)',
          servingSizeLabel: 'सर्व्हिंग्ज',
          servingSizePlaceholder: 'उदा. २',
          cuisineTypeLabel: 'पाककृती प्रकार', // New field
          cuisineTypePlaceholder: 'उदा. भारतीय, मेक्सिकन, थाई', // New field
          cookingMethodLabel: 'शिजवण्याची पद्धत', // New field
          cookingMethodPlaceholder: 'उदा. बेकिंग, स्टिर-फ्राय, ग्रिलिंग', // New field
          includeDetailsLabel: 'तपशील समाविष्ट करायचे?',
          includeDetailsHint: '(पोषण/आहार)',
          includeDetailsAriaLabel: 'पोषण तथ्ये आणि आहार योजना योग्यता समाविष्ट करा',
          submitButton: 'सूचना मिळवा',
          submitButtonLoading: 'रेसिपी शोधत आहे...',
          resetButton: 'फॉर्म साफ करा',
          footerNote: 'AI तुमच्या इनपुटवर आधारित सूचना तयार करते. परिणाम भिन्न असू शकतात. ऍलर्जी तपासा!',
      },
      results: {
          title: 'तुमच्या रेसिपी सूचना',
          imageAlt: '{recipeName} साठी तयार केलेली प्रतिमा',
          saveButtonAriaLabel: 'रेसिपी जतन करा',
          saveButtonTooltip: 'रेसिपी जतन करा',
          ingredientsTitle: 'साहित्य',
          instructionsTitle: 'कृती',
          noRecipesFoundTitle: 'तुमच्या निकषांशी जुळणारी कोणतीही रेसिपी आढळली नाही.',
          noRecipesFoundSuggestion: 'चांगल्या परिणामांसाठी तुमचे साहित्य किंवा प्राधान्ये समायोजित करण्याचा प्रयत्न करा!',
          defaultDescription: 'तुमच्या साहित्यावर आधारित एक स्वादिष्ट रेसिपी सूचना.',
          viewRecipeButton: 'रेसिपी पहा',
      },
      recipeDetail: {
         backButton: 'सूचनांवर परत जा',
         nutritionTitle: 'पोषण तथ्ये (अंदाजित)',
         dietPlanTitle: 'आहार योजना योग्यता',
         nutritionPlaceholder: 'पोषण माहिती उपलब्ध असल्यास येथे दिसेल.',
         dietPlanPlaceholder: 'आहार योजना योग्यतेची माहिती उपलब्ध असल्यास येथे दिसेल.',
         ingredientsPlaceholder: 'कोणतेही साहित्य सूचीबद्ध नाही.',
         instructionsPlaceholder: 'कोणतीही कृती उपलब्ध नाही.',
         imagePromptLabel: 'प्रतिमा प्रॉम्प्ट',
         errorLoadingTitle: 'रेसिपी लोड करण्यात त्रुटी',
         errorLoadingMessage: 'या रेसिपीचा तपशील लोड होऊ शकला नाही. तो गहाळ असू शकतो किंवा लिंक चुकीची असू शकते.',
       },
      toast: {
          formClearedTitle: 'फॉर्म साफ केला',
          formClearedDesc: 'नवीन साहित्यासाठी तयार!',
          recipeSavedTitle: 'रेसिपी जतन केली!',
          recipeSavedDesc: '{recipeName} तुमच्या आवडींमध्ये जोडले आहे (सिम्युलेशन).',
          noRecipesTitle: 'कोणतीही रेसिपी आढळली नाही',
          noRecipesDesc: 'दिलेल्या साहित्य आणि प्राधान्यांसह कोणतीही रेसिपी सापडली नाही. तुमचे इनपुट समायोजित करण्याचा प्रयत्न करा.',
          recipesFoundTitle: 'रेसिपी सापडल्या!',
          recipesFoundDesc: 'आम्हाला तुमच्यासाठी {count} रेसिपी सूचना सापडल्या.',
          errorTitle: 'त्रुटी',
          genericError: 'रेसिपी सुचवण्यात अयशस्वी. कृपया नंतर पुन्हा प्रयत्न करा.',
          validationError: 'इनपुट प्रमाणीकरण अयशस्वी. कृपया आपल्या नोंदी तपासा.',
      },
      footer: {
          builtWith: '❤️ ने बनवले आहे ',
          poweredBy: 'जेमिनी द्वारा समर्थित.',
          copyright: '© {year} रेसिपीसेज. सर्व हक्क राखीव (खरे नाही).',
      },
  },
  ta: {
      appTitle: 'ரெசிபிசேஜ்',
      loadingMessage: 'சுவையான யோசனைகள் உருவாக்கப்படுகின்றன...',
      quickModePreference: 'விரைவு உணவு (30 நிமிடங்களுக்குள்)',
      servingSizePreference: '{count} பேருக்கு',
      languageSelector: {
          ariaLabel: 'மொழியைத் தேர்ந்தெடுக்கவும்',
          placeholder: 'மொழி',
          tooltip: 'மொழியைத் தேர்ந்தெடுக்கவும்',
      },
      themeSelector: {
          ariaLabel: 'தீம் மாற்றவும்',
          tooltip: 'தீம் மாற்றவும்',
          light: 'ஒளி',
          dark: 'இருள்',
          system: 'கணினி',
      },
      hero: {
          title: 'உங்கள் உள்ளிருக்கும் சமையல்காரரைத் திறக்கவும்!',
          subtitle: 'உங்களிடம் உள்ள பொருட்களை உள்ளிடவும், விருப்பங்களைச் சேர்க்கவும், மேலும் ரெசிபிசேஜ் உங்களுக்காகப் பிரத்தியேகமாகத் தயாரிக்கப்பட்ட உங்களின் அடுத்த சுவையான உணவைக் கண்டறியட்டும்.',
      },
      form: {
          title: 'சமையல் குறிப்புகளைக் கண்டறியவும்',
          description: 'உங்களிடம் என்ன இருக்கிறது, உங்களுக்கு என்ன பிடிக்கும் என்று எங்களிடம் கூறுங்கள். மீதமுள்ளதை நாங்கள் கவனித்துக்கொள்வோம்!',
          ingredientsLabel: 'கிடைக்கும் பொருட்கள்',
          ingredientsPlaceholder: 'எ.கா., சிக்கன் பிரஸ்ட், ப்ரோக்கோலி, சோயா சாஸ், அரிசி, பூண்டு...',
          ingredientsError: 'தயவுசெய்து குறைந்தது சில பொருட்களையாவது உள்ளிடவும்.',
          dietaryRestrictionsLabel: 'உணவு கட்டுப்பாடுகள்',
          dietaryRestrictionsPlaceholder: 'எ.கா., சைவம், பசையம் இல்லாதது',
          preferencesLabel: 'மற்ற விருப்பத்தேர்வுகள்',
          preferencesPlaceholder: 'எ.கா., காரமானது, இத்தாலிய உணவு, ஆரோக்கியமானது',
          quickModeLabel: 'விரைவு பயன்முறை?',
          quickModeHint: '(30 நிமிடங்களுக்குள்)',
          quickModeAriaLabel: 'விரைவு பயன்முறை (30 நிமிடங்களுக்குள்)',
          servingSizeLabel: 'பரிமாறும் அளவு',
          servingSizePlaceholder: 'எ.கா., 2',
          cuisineTypeLabel: 'சமையல் வகை', // New field
          cuisineTypePlaceholder: 'எ.கா., இந்தியன், மெக்சிகன், தாய்', // New field
          cookingMethodLabel: 'சமையல் முறை', // New field
          cookingMethodPlaceholder: 'எ.கா., பேக்கிங், ஸ்டிர்-ஃப்ரை, கிரில்லிங்', // New field
          includeDetailsLabel: 'விவரங்களைச் சேர்க்கவா?',
          includeDetailsHint: '(ஊட்டச்சத்து/உணவு)',
          includeDetailsAriaLabel: 'ஊட்டச்சத்து உண்மைகள் மற்றும் உணவுத் திட்டப் பொருத்தத்தைச் சேர்க்கவும்',
          submitButton: 'பரிந்துரைகளைப் பெறுக',
          submitButtonLoading: 'சமையல் குறிப்புகள் தேடப்படுகின்றன...',
          resetButton: 'படிவத்தை அழிக்கவும்',
          footerNote: 'AI உங்கள் உள்ளீட்டின் அடிப்படையில் பரிந்துரைகளை உருவாக்குகிறது. முடிவுகள் மாறுபடலாம். ஒவ்வாமைகளை இருமுறை சரிபார்க்கவும்!',
      },
      results: {
          title: 'உங்கள் சமையல் குறிப்பு பரிந்துரைகள்',
          imageAlt: '{recipeName} க்கான உருவாக்கப்பட்ட படம்',
          saveButtonAriaLabel: 'சமையல் குறிப்பைச் சேமி',
          saveButtonTooltip: 'சமையல் குறிப்பைச் சேமி',
          ingredientsTitle: 'பொருட்கள்',
          instructionsTitle: 'செய்முறை',
          noRecipesFoundTitle: 'உங்கள் நிபந்தனைகளுடன் பொருந்தக்கூடிய சமையல் குறிப்புகள் எதுவும் இல்லை.',
          noRecipesFoundSuggestion: 'சிறந்த முடிவுகளுக்கு உங்கள் பொருட்கள் அல்லது விருப்பங்களைச் சரிசெய்ய முயற்சிக்கவும்!',
          defaultDescription: 'உங்கள் பொருட்களின் அடிப்படையில் ஒரு சுவையான சமையல் குறிப்பு பரிந்துரை.',
          viewRecipeButton: 'செய்முறையைப் பார்க்க',
      },
      recipeDetail: {
         backButton: 'பரிந்துரைகளுக்குத் திரும்பு',
         nutritionTitle: 'ஊட்டச்சத்து உண்மைகள் (மதிப்பிடப்பட்டது)',
         dietPlanTitle: 'உணவுத் திட்டப் பொருத்தம்',
         nutritionPlaceholder: 'ஊட்டச்சத்து தகவல் கிடைத்தால் இங்கே தோன்றும்.',
         dietPlanPlaceholder: 'உணவுத் திட்டப் பொருத்தம் பற்றிய தகவல் கிடைத்தால் இங்கே தோன்றும்.',
         ingredientsPlaceholder: 'பொருட்கள் எதுவும் பட்டியலிடப்படவில்லை.',
         instructionsPlaceholder: 'செய்முறை எதுவும் கிடைக்கவில்லை.',
         imagePromptLabel: 'பட உந்தல்',
         errorLoadingTitle: 'செய்முறையை ஏற்றுவதில் பிழை',
         errorLoadingMessage: 'இந்த செய்முறையின் விவரங்களை ஏற்ற முடியவில்லை. அது விடுபட்டிருக்கலாம் அல்லது இணைப்பு தவறாக இருக்கலாம்.',
       },
      toast: {
          formClearedTitle: 'படிவம் அழிக்கப்பட்டது',
          formClearedDesc: 'புதிய பொருட்களுக்குத் தயார்!',
          recipeSavedTitle: 'சமையல் குறிப்பு சேமிக்கப்பட்டது!',
          recipeSavedDesc: '{recipeName} உங்கள் விருப்பங்களில் சேர்க்கப்பட்டது (simulation).',
          noRecipesTitle: 'சமையல் குறிப்புகள் எதுவும் இல்லை',
          noRecipesDesc: 'கொடுக்கப்பட்ட பொருட்கள் மற்றும் விருப்பங்களுடன் எந்த சமையல் குறிப்புகளையும் கண்டுபிடிக்க முடியவில்லை. உங்கள் உள்ளீட்டைச் சரிசெய்ய முயற்சிக்கவும்.',
          recipesFoundTitle: 'சமையல் குறிப்புகள் கிடைத்தன!',
          recipesFoundDesc: 'உங்களுக்காக {count} சமையல் குறிப்பு பரிந்துரைகளைக் கண்டறிந்துள்ளோம்.',
          errorTitle: 'பிழை',
          genericError: 'சமையல் குறிப்புகளைப் பரிந்துரைக்க முடியவில்லை. தயவுசெய்து பின்னர் மீண்டும் முயற்சிக்கவும்.',
          validationError: 'உள்ளீட்டு சரிபார்ப்பு தோல்வியடைந்தது. உங்கள் உள்ளீடுகளை சரிபார்க்கவும்.',
      },
      footer: {
          builtWith: '❤️ ஆல் உருவாக்கப்பட்டது ',
          poweredBy: 'ஜெமினி மூலம் இயக்கப்படுகிறது.',
          copyright: '© {year} ரெசிபிசேஜ். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை (உண்மையில் இல்லை).',
      },
  },
  te: {
      appTitle: 'రెసిపీసేజ్',
      loadingMessage: 'రుచికరమైన ఆలోచనలు రూపొందించబడుతున్నాయి...',
      quickModePreference: 'త్వరిత భోజనం (30 నిమిషాలలోపు)',
      servingSizePreference: '{count} మందికి',
      languageSelector: {
          ariaLabel: 'భాషను ఎంచుకోండి',
          placeholder: 'భాష',
          tooltip: 'భాషను ఎంచుకోండి',
      },
      themeSelector: {
          ariaLabel: 'థీమ్‌ని టోగుల్ చేయండి',
          tooltip: 'థీమ్‌ను మార్చండి',
          light: 'లైట్',
          dark: 'డార్క్',
          system: 'సిస్టమ్',
      },
      hero: {
          title: 'మీలోని చెఫ్‌ను అన్‌లాక్ చేయండి!',
          subtitle: 'మీ దగ్గర ఉన్న పదార్థాలను నమోదు చేయండి, ప్రాధాన్యతలను జోడించండి మరియు రెసిపీసేజ్ మీ తదుపరి రుచికరమైన భోజనాన్ని కనుగొననివ్వండి, మీ కోసం ప్రత్యేకంగా రూపొందించబడింది.',
      },
      form: {
          title: 'వంటకాలను కనుగొనండి',
          description: 'మీ దగ్గర ఏముందో మరియు మీకు ఏమి ఇష్టమో మాకు చెప్పండి. మిగిలినది మేము చూసుకుంటాం!',
          ingredientsLabel: 'అందుబాటులో ఉన్న పదార్థాలు',
          ingredientsPlaceholder: 'ఉదా., చికెన్ బ్రెస్ట్, బ్రోకలీ, సోయా సాస్, బియ్యం, వెల్లుల్లి...',
          ingredientsError: 'దయచేసి కనీసం కొన్ని పదార్థాలను నమోదు చేయండి.',
          dietaryRestrictionsLabel: 'ఆహార పరిమితులు',
          dietaryRestrictionsPlaceholder: 'ఉదా., శాఖాహారం, గ్లూటెన్-రహితం',
          preferencesLabel: 'ఇతర ప్రాధాన్యతలు',
          preferencesPlaceholder: 'ఉదా., కారంగా, ఇటాలియన్ వంటకాలు, ఆరోగ్యకరమైన',
          quickModeLabel: 'త్వరిత మోడ్?',
          quickModeHint: '(30 నిమిషాలలోపు)',
          quickModeAriaLabel: 'త్వరిత మోడ్ (30 నిమిషాలలోపు)',
          servingSizeLabel: 'సర్వింగ్‌లు',
          servingSizePlaceholder: 'ఉదా., 2',
          cuisineTypeLabel: 'వంటకం రకం', // New field
          cuisineTypePlaceholder: 'ఉదా., ఇండియన్, మెక్సికన్, థాయ్', // New field
          cookingMethodLabel: 'వంట పద్ధతి', // New field
          cookingMethodPlaceholder: 'ఉదా., బేకింగ్, స్టర్-ఫ్రై, గ్రిల్లింగ్', // New field
          includeDetailsLabel: 'వివరాలను చేర్చాలా?',
          includeDetailsHint: '(పోషకాహారం/ఆహారం)',
          includeDetailsAriaLabel: 'పోషకాహార వాస్తవాలు మరియు ఆహార ప్రణాళిక అనుకూలతను చేర్చండి',
          submitButton: 'సూచనలను పొందండి',
          submitButtonLoading: 'వంటకాలు కనుగొనబడుతున్నాయి...',
          resetButton: 'ఫారమ్‌ను క్లియర్ చేయండి',
          footerNote: 'AI మీ ఇన్‌పుట్ ఆధారంగా సూచనలను రూపొందిస్తుంది. ఫలితాలు మారవచ్చు. అలెర్జీలను రెండుసార్లు తనిఖీ చేయండి!',
      },
      results: {
          title: 'మీ వంటకం సూచనలు',
          imageAlt: '{recipeName} కోసం రూపొందించిన చిత్రం',
          saveButtonAriaLabel: 'వంటకాన్ని సేవ్ చేయండి',
          saveButtonTooltip: 'వంటకాన్ని సేవ్ చేయండి',
          ingredientsTitle: 'పదార్థాలు',
          instructionsTitle: 'సూచనలు',
          noRecipesFoundTitle: 'మీ ప్రమాణాలకు సరిపోయే వంటకాలు ఏవీ కనుగొనబడలేదు.',
          noRecipesFoundSuggestion: 'మెరుగైన అదృష్టం కోసం మీ పదార్థాలు లేదా ప్రాధాన్యతలను సర్దుబాటు చేయడానికి ప్రయత్నించండి!',
          defaultDescription: 'మీ పదార్థాల ఆధారంగా ఒక రుచికరమైన వంటకం సూచన.',
          viewRecipeButton: 'వంటకాన్ని చూడండి',
      },
      recipeDetail: {
         backButton: 'సూచనలకు తిరిగి వెళ్ళు',
         nutritionTitle: 'పోషకాహార వాస్తవాలు (అంచనా)',
         dietPlanTitle: 'ఆహార ప్రణాళిక అనుకూలత',
         nutritionPlaceholder: 'పోషకాహార సమాచారం అందుబాటులో ఉంటే ఇక్కడ కనిపిస్తుంది.',
         dietPlanPlaceholder: 'ఆహార ప్రణాళిక అనుకూలత సమాచారం అందుబాటులో ఉంటే ఇక్కడ కనిపిస్తుంది.',
         ingredientsPlaceholder: 'పదార్థాలు ఏవీ జాబితా చేయబడలేదు.',
         instructionsPlaceholder: 'సూచనలు ఏవీ అందుబాటులో లేవు.',
         imagePromptLabel: 'చిత్ర ప్రాంప్ట్',
         errorLoadingTitle: 'వంటకాన్ని లోడ్ చేయడంలో లోపం',
         errorLoadingMessage: 'ఈ వంటకం వివరాలను లోడ్ చేయలేకపోయాము. అది అందుబాటులో లేకపోవచ్చు లేదా లింక్ తప్పుగా ఉండవచ్చు.',
       },
      toast: {
          formClearedTitle: 'ఫారమ్ క్లియర్ చేయబడింది',
          formClearedDesc: 'కొత్త పదార్థాల కోసం సిద్ధంగా ఉంది!',
          recipeSavedTitle: 'వంటకం సేవ్ చేయబడింది!',
          recipeSavedDesc: '{recipeName} మీ ఇష్టమైన వాటికి జోడించబడింది (simulation).',
          noRecipesTitle: 'వంటకాలు ఏవీ కనుగొనబడలేదు',
          noRecipesDesc: 'ఇచ్చిన పదార్థాలు మరియు ప్రాధాన్యతలతో ఏ వంటకాలను కనుగొనలేకపోయాము. మీ ఇన్‌పుట్‌ను సర్దుబాటు చేయడానికి ప్రయత్నించండి.',
          recipesFoundTitle: 'వంటకాలు కనుగొనబడ్డాయి!',
          recipesFoundDesc: 'మేము మీ కోసం {count} వంటకం సూచనలను కనుగొన్నాము.',
          errorTitle: 'లోపం',
          genericError: 'వంటకాలను సూచించడంలో విఫలమైంది. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.',
          validationError: 'ఇన్‌పుట్ ధ్రువీకరణ విఫలమైంది. దయచేసి మీ ఎంట్రీలను తనిఖీ చేయండి.',
      },
      footer: {
          builtWith: '❤️ ద్వారా నిర్మించబడింది ',
          poweredBy: 'జెమినీ ద్వారా శక్తివంతం చేయబడింది.',
          copyright: '© {year} రెసిపీసేజ్. అన్ని హక్కులు ప్రత్యేకించబడ్డాయి (నిజంగా కాదు).',
      },
  },
  or: {
      appTitle: 'ରେସିପିସେଜ୍',
      loadingMessage: 'ସୁସ୍ୱାଦୁ ବିଚାର ପ୍ରସ୍ତୁତ ହେଉଛି...',
      quickModePreference: 'ଶୀଘ୍ର ଖାଦ୍ୟ (୩୦ ମିନିଟରୁ କମ୍)',
      servingSizePreference: '{count} ଜଣଙ୍କ ପାଇଁ',
      languageSelector: {
          ariaLabel: 'ଭାଷା ଚୟନ କରନ୍ତୁ',
          placeholder: 'ଭାଷା',
          tooltip: 'ଭାଷା ଚୟନ କରନ୍ତୁ',
      },
      themeSelector: {
          ariaLabel: 'ଥିମ୍ ଟୋଗଲ୍ କରନ୍ତୁ',
          tooltip: 'ଥିମ୍ ବଦଳାନ୍ତୁ',
          light: 'ଲାଇଟ୍',
          dark: 'ଡାର୍କ',
          system: 'ସିଷ୍ଟମ୍',
      },
      hero: {
          title: 'ଆପଣଙ୍କ ଭିତରର ରୋଷେୟାକୁ ଅନଲକ୍ କରନ୍ତୁ!',
          subtitle: 'ଆପଣଙ୍କ ପାଖରେ ଥିବା ଉପାଦାନଗୁଡିକ ଲେଖନ୍ତୁ, ପସନ୍ଦ ଯୋଡନ୍ତୁ, ଏବଂ ରେସିପିସେଜ୍ କୁ ଆପଣଙ୍କ ପରବର୍ତ୍ତୀ ସୁସ୍ୱାଦୁ ଖାଦ୍ୟ ଖୋଜିବାକୁ ଦିଅନ୍ତୁ, କେବଳ ଆପଣଙ୍କ ପାଇଁ ତିଆରି।',
      },
      form: {
          title: 'ରେସିପି ଖୋଜନ୍ତୁ',
          description: 'ଆମକୁ କୁହନ୍ତୁ ଆପଣଙ୍କ ପାଖରେ କଣ ଅଛି ଏବଂ ଆପଣ କଣ ପସନ୍ଦ କରନ୍ତି। ବାକି ଆମେ ସମ୍ଭାଳିବୁ!',
          ingredientsLabel: 'ଉପଲବ୍ଧ ଉପାଦାନ',
          ingredientsPlaceholder: 'ଯେପରି, ଚିକେନ୍ ବ୍ରେଷ୍ଟ, ବ୍ରୋକୋଲି, ସୋୟା ସସ୍, ଭାତ, ରସୁଣ...',
          ingredientsError: 'ଦୟାକରି ଅତିକମରେ କିଛି ଉପାଦାନ ଲେଖନ୍ତୁ।',
          dietaryRestrictionsLabel: 'ଆହାର ସମ୍ବନ୍ଧୀୟ ପ୍ରତିବନ୍ଧକ',
          dietaryRestrictionsPlaceholder: 'ଯେପରି, ଶାକାହାରୀ, ଗ୍ଲୁଟେନ୍-ମୁକ୍ତ',
          preferencesLabel: 'ଅନ୍ୟ ପସନ୍ଦଗୁଡିକ',
          preferencesPlaceholder: 'ଯେପରି, ମସଲାଯୁକ୍ତ, ଇଟାଲୀୟ ରନ୍ଧନ, ସ୍ୱାସ୍ଥ୍ୟକର',
          quickModeLabel: 'ଶୀଘ୍ର ମୋଡ୍?',
          quickModeHint: '(୩୦ ମିନିଟ୍ ତଳେ)',
          quickModeAriaLabel: 'ଶୀଘ୍ର ମୋଡ୍ (୩୦ ମିନିଟ୍ ତଳେ)',
          servingSizeLabel: 'ସର୍ଭିଙ୍ଗ୍ ସଂଖ୍ୟା',
          servingSizePlaceholder: 'ଯେପରି, ୨',
          cuisineTypeLabel: 'ରନ୍ଧନ ପ୍ରକାର', // New field
          cuisineTypePlaceholder: 'ଯେପରି, ଭାରତୀୟ, ମେକ୍ସିକାନ୍, ଥାଇ', // New field
          cookingMethodLabel: 'ରାନ୍ଧିବା ପଦ୍ଧତି', // New field
          cookingMethodPlaceholder: 'ଯେପରି, ବେକିଙ୍ଗ୍, ଷ୍ଟିର୍-ଫ୍ରାଏ, ଗ୍ରିଲିଙ୍ଗ୍', // New field
          includeDetailsLabel: 'ବିବରଣୀ ସାମିଲ କରନ୍ତୁ?',
          includeDetailsHint: '(ପୋଷଣ/ଆହାର)',
          includeDetailsAriaLabel: 'ପୋଷଣ ତଥ୍ୟ ଏବଂ ଆହାର ଯୋଜନା ଉପଯୁକ୍ତତା ସାମିଲ କରନ୍ତୁ',
          submitButton: 'ପରାମର୍ଶ ପାଆନ୍ତୁ',
          submitButtonLoading: 'ରେସିପି ଖୋଜା ଚାଲିଛି...',
          resetButton: 'ଫର୍ମ ସଫା କରନ୍ତୁ',
          footerNote: 'AI ଆପଣଙ୍କ ଇନପୁଟ୍ ଆଧାରରେ ପରାମର୍ଶ ଦେଇଥାଏ। ଫଳାଫଳ ଭିନ୍ନ ହୋଇପାରେ। ଆଲର୍ଜି ଦୁଇଥର ଯାଞ୍ଚ କରନ୍ତୁ!',
      },
      results: {
          title: 'ଆପଣଙ୍କ ରେସିପି ପରାମର୍ଶ',
          imageAlt: '{recipeName} ପାଇଁ ଜେନେରେଟ୍ ହୋଇଥିବା ଚିତ୍ର',
          saveButtonAriaLabel: 'ରେସିପି ସଂରକ୍ଷଣ କରନ୍ତୁ',
          saveButtonTooltip: 'ରେସିପି ସଂରକ୍ଷଣ କରନ୍ତୁ',
          ingredientsTitle: 'ଉପାଦାନ',
          instructionsTitle: 'ନିର୍ଦ୍ଦେଶାବଳୀ',
          noRecipesFoundTitle: 'ଆପଣଙ୍କ ମାନଦଣ୍ଡ ସହିତ ମେଳ ଖାଉଥିବା କୌଣସି ରେସିପି ମିଳିଲା ନାହିଁ।',
          noRecipesFoundSuggestion: 'ଭଲ ଫଳାଫଳ ପାଇଁ ଆପଣଙ୍କ ଉପାଦାନ କିମ୍ବା ପସନ୍ଦଗୁଡିକ ସଜାଡିବାକୁ ଚେଷ୍ଟା କରନ୍ତୁ!',
          defaultDescription: 'ଆପଣଙ୍କ ଉପାଦାନ ଆଧାରରେ ଏକ ସୁସ୍ୱାଦୁ ରେସିପି ପରାମର୍ଶ।',
          viewRecipeButton: 'ରେସିପି ଦେଖନ୍ତୁ',
      },
       recipeDetail: {
         backButton: 'ପରାମର୍ଶକୁ ଫେରନ୍ତୁ',
         nutritionTitle: 'ପୋଷଣ ତଥ୍ୟ (ଆନୁମାନିକ)',
         dietPlanTitle: 'ଆହାର ଯୋଜନା ଉପଯୁକ୍ତତା',
         nutritionPlaceholder: 'ପୋଷଣ ତଥ୍ୟ ଉପଲବ୍ଧ ହେଲେ ଏଠାରେ ଦେଖାଯିବ।',
         dietPlanPlaceholder: 'ଆହାର ଯୋଜନା ଉପଯୁକ୍ତତା ତଥ୍ୟ ଉପଲବ୍ଧ ହେଲେ ଏଠାରେ ଦେଖାଯିବ।',
         ingredientsPlaceholder: 'କୌଣସି ଉପାଦାନ ତାଲିକାଭୁକ୍ତ ହୋଇନାହିଁ।',
         instructionsPlaceholder: 'କୌଣସି ନିର୍ଦ୍ଦେଶାବଳୀ ଉପଲବ୍ଧ ନାହିଁ।',
         imagePromptLabel: 'ଚିତ୍ର ପ୍ରମ୍ପ୍ଟ',
         errorLoadingTitle: 'ରେସିପି ଲୋଡ୍ କରିବାରେ ତ୍ରୁଟି',
         errorLoadingMessage: 'ଏହି ରେସିପିର ବିବରଣୀ ଲୋଡ୍ ହୋଇପାରିଲା ନାହିଁ। ଏହା ହଜିଯାଇଥାଇପାରେ କିମ୍ବା ଲିଙ୍କ୍ ଭୁଲ୍ ହୋଇପାରେ।',
       },
      toast: {
          formClearedTitle: 'ଫର୍ମ ସଫା କରାଗଲା',
          formClearedDesc: 'ନୂଆ ଉପାଦାନ ପାଇଁ ପ୍ରସ୍ତୁତ!',
          recipeSavedTitle: 'ରେସିପି ସଂରକ୍ଷିତ ହେଲା!',
          recipeSavedDesc: '{recipeName} ଆପଣଙ୍କ ପସନ୍ଦ ତାଲିକାରେ ଯୋଡା ଯାଇଛି (ସିମୁଲେସନ୍)।',
          noRecipesTitle: 'କୌଣସି ରେସିପି ମିଳିଲା ନାହିଁ',
          noRecipesDesc: 'ପ୍ରଦତ୍ତ ଉପାଦାନ ଏବଂ ପସନ୍ଦଗୁଡିକ ସହିତ କୌଣସି ରେସିପି ମିଳିଲା ନାହିଁ। ଆପଣଙ୍କ ଇନପୁଟ୍ ସଜାଡିବାକୁ ଚେଷ୍ଟା କରନ୍ତୁ।',
          recipesFoundTitle: 'ରେସିପି ମିଳିଲା!',
          recipesFoundDesc: 'ଆମେ ଆପଣଙ୍କ ପାଇଁ {count}ଟି ରେସିପି ପରାମର୍ଶ ପାଇଛୁ।',
          errorTitle: 'ତ୍ରୁଟି',
          genericError: 'ରେସିପି ପରାମର୍ଶ ଦେବାରେ ବିଫଳ। ଦୟାକରି ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।',
          validationError: 'ଇନପୁଟ୍ ବୈଧତା ବିଫଳ ହେଲା। ଦୟାକରି ଆପଣଙ୍କର ପ୍ରବିଷ୍ଟିଗୁଡିକ ଯାଞ୍ଚ କରନ୍ତୁ।',
      },
      footer: {
          builtWith: '❤️ ଦ୍ୱାରା ନିର୍ମିତ ',
          poweredBy: 'ଜେମିନି ଦ୍ୱାରା ଚାଳିତ।',
          copyright: '© {year} ରେସିପିସେଜ୍। ସର୍ବସ୍ୱତ୍ତ୍ୱ ସଂରକ୍ଷିତ (ବାସ୍ତବରେ ନୁହେଁ)।',
      },
  },
  pa: {
      appTitle: 'ਰੈਸਿਪੀਸੇਜ',
      loadingMessage: 'ਸੁਆਦੀ ਵਿਚਾਰ ਤਿਆਰ ਹੋ ਰਹੇ ਹਨ...',
      quickModePreference: 'ਤੁਰੰਤ ਭੋਜਨ (30 ਮਿੰਟ ਤੋਂ ਘੱਟ)',
      servingSizePreference: '{count} ਲੋਕਾਂ ਲਈ',
      languageSelector: {
          ariaLabel: 'ਭਾਸ਼ਾ ਚੁਣੋ',
          placeholder: 'ਭਾਸ਼ਾ',
          tooltip: 'ਭਾਸ਼ਾ ਚੁਣੋ',
      },
      themeSelector: {
          ariaLabel: 'ਥੀਮ ਟੌਗਲ ਕਰੋ',
          tooltip: 'ਥੀਮ ਬਦਲੋ',
          light: 'ਲਾਈਟ',
          dark: 'ਡਾਰਕ',
          system: 'ਸਿਸਟਮ',
      },
      hero: {
          title: 'ਆਪਣੇ ਅੰਦਰ ਦੇ ਸ਼ੈੱਫ ਨੂੰ ਅਨਲੌਕ ਕਰੋ!',
          subtitle: 'ਤੁਹਾਡੇ ਕੋਲ ਮੌਜੂਦ ਸਮੱਗਰੀ ਦਰਜ ਕਰੋ, ਤਰਜੀਹਾਂ ਸ਼ਾਮਲ ਕਰੋ, ਅਤੇ ਰੈਸਿਪੀਸੇਜ ਨੂੰ ਤੁਹਾਡਾ ਅਗਲਾ ਸੁਆਦੀ ਭੋਜਨ ਲੱਭਣ ਦਿਓ, ਜੋ ਸਿਰਫ਼ ਤੁਹਾਡੇ ਲਈ ਤਿਆਰ ਕੀਤਾ ਗਿਆ ਹੈ।',
      },
      form: {
          title: 'ਵਿਅੰਜਨ ਲੱਭੋ',
          description: 'ਸਾਨੂੰ ਦੱਸੋ ਕਿ ਤੁਹਾਡੇ ਕੋਲ ਕੀ ਹੈ ਅਤੇ ਤੁਹਾਨੂੰ ਕੀ ਪਸੰਦ ਹੈ। ਬਾਕੀ ਅਸੀਂ ਸੰਭਾਲ ਲਵਾਂਗੇ!',
          ingredientsLabel: 'ਉਪਲਬਧ ਸਮੱਗਰੀ',
          ingredientsPlaceholder: 'ਜਿਵੇਂ ਕਿ, ਚਿਕਨ ਬ੍ਰੈਸਟ, ਬਰੋਕਲੀ, ਸੋਇਆ ਸਾਸ, ਚਾਵਲ, ਲਸਣ...',
          ingredientsError: 'ਕਿਰਪਾ ਕਰਕੇ ਘੱਟੋ-ਘੱਟ ਕੁਝ ਸਮੱਗਰੀ ਦਰਜ ਕਰੋ।',
          dietaryRestrictionsLabel: 'ਖੁਰਾਕ ਸੰਬੰਧੀ ਪਾਬੰਦੀਆਂ',
          dietaryRestrictionsPlaceholder: 'ਜਿਵੇਂ ਕਿ, ਸ਼ਾਕਾਹਾਰੀ, ਗਲੂਟਨ-ਮੁਕਤ',
          preferencesLabel: 'ਹੋਰ ਤਰਜੀਹਾਂ',
          preferencesPlaceholder: 'ਜਿਵੇਂ ਕਿ, ਮਸਾਲੇਦਾਰ, ਇਤਾਲਵੀ ਪਕਵਾਨ, ਸਿਹਤਮੰਦ',
          quickModeLabel: 'ਤੁਰੰਤ ਮੋਡ?',
          quickModeHint: '(੩੦ ਮਿੰਟ ਤੋਂ ਘੱਟ)',
          quickModeAriaLabel: 'ਤੁਰੰਤ ਮੋਡ (੩੦ ਮਿੰਟ ਤੋਂ ਘੱਟ)',
          servingSizeLabel: 'ਸਰਵਿੰਗਜ਼',
          servingSizePlaceholder: 'ਜਿਵੇਂ ਕਿ, ੨',
          cuisineTypeLabel: 'ਪਕਵਾਨ ਦੀ ਕਿਸਮ', // New field
          cuisineTypePlaceholder: 'ਜਿਵੇਂ ਕਿ, ਭਾਰਤੀ, ਮੈਕਸੀਕਨ, ਥਾਈ', // New field
          cookingMethodLabel: 'ਖਾਣਾ ਪਕਾਉਣ ਦਾ ਢੰਗ', // New field
          cookingMethodPlaceholder: 'ਜਿਵੇਂ ਕਿ, ਬੇਕਿੰਗ, ਸਟਰ-ਫਰਾਈ, ਗ੍ਰਿਲਿੰਗ', // New field
          includeDetailsLabel: 'ਵੇਰਵੇ ਸ਼ਾਮਲ ਕਰੀਏ?',
          includeDetailsHint: '(ਪੋਸ਼ਣ/ਖੁਰਾਕ)',
          includeDetailsAriaLabel: 'ਪੋਸ਼ਣ ਸੰਬੰਧੀ ਤੱਥ ਅਤੇ ਖੁਰਾਕ ਯੋਜਨਾ ਦੀ ਯੋਗਤਾ ਸ਼ਾਮਲ ਕਰੋ',
          submitButton: 'ਸੁਝਾਅ ਪ੍ਰਾਪਤ ਕਰੋ',
          submitButtonLoading: 'ਵਿਅੰਜਨ ਲੱਭੇ ਜਾ ਰਹੇ ਹਨ...',
          resetButton: 'ਫਾਰਮ ਸਾਫ਼ ਕਰੋ',
          footerNote: 'AI ਤੁਹਾਡੇ ਇਨਪੁਟ ਦੇ ਆਧਾਰ \'ਤੇ ਸੁਝਾਅ ਤਿਆਰ ਕਰਦਾ ਹੈ। ਨਤੀਜੇ ਵੱਖ-ਵੱਖ ਹੋ ਸਕਦੇ ਹਨ। ਐਲਰਜੀ ਦੀ ਦੋ ਵਾਰ ਜਾਂਚ ਕਰੋ!',
      },
      results: {
          title: 'ਤੁਹਾਡੇ ਵਿਅੰਜਨ ਸੁਝਾਅ',
          imageAlt: '{recipeName} ਲਈ ਤਿਆਰ ਕੀਤੀ ਗਈ ਤਸਵੀਰ',
          saveButtonAriaLabel: 'ਵਿਅੰਜਨ ਸੁਰੱਖਿਅਤ ਕਰੋ',
          saveButtonTooltip: 'ਵਿਅੰਜਨ ਸੁਰੱਖਿਅਤ ਕਰੋ',
          ingredientsTitle: 'ਸਮੱਗਰੀ',
          instructionsTitle: 'ਨਿਰਦੇਸ਼',
          noRecipesFoundTitle: 'ਤੁਹਾਡੇ ਮਾਪਦੰਡਾਂ ਨਾਲ ਮੇਲ ਖਾਂਦਾ ਕੋਈ ਵਿਅੰਜਨ ਨਹੀਂ ਮਿਲਿਆ।',
          noRecipesFoundSuggestion: 'ਬਿਹਤਰ ਕਿਸਮਤ ਲਈ ਆਪਣੀ ਸਮੱਗਰੀ ਜਾਂ ਤਰਜੀਹਾਂ ਨੂੰ ਵਿਵਸਥਿਤ ਕਰਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ!',
          defaultDescription: 'ਤੁਹਾਡੀ ਸਮੱਗਰੀ ਦੇ ਆਧਾਰ \'ਤੇ ਇੱਕ ਸੁਆਦੀ ਵਿਅੰਜਨ ਸੁਝਾਅ।',
          viewRecipeButton: 'ਵਿਅੰਜਨ ਵੇਖੋ',
      },
       recipeDetail: {
         backButton: 'ਸੁਝਾਵਾਂ \'ਤੇ ਵਾਪਸ ਜਾਓ',
         nutritionTitle: 'ਪੋਸ਼ਣ ਸੰਬੰਧੀ ਤੱਥ (ਅਨੁਮਾਨਿਤ)',
         dietPlanTitle: 'ਖੁਰਾਕ ਯੋਜਨਾ ਯੋਗਤਾ',
         nutritionPlaceholder: 'ਪੋਸ਼ਣ ਸੰਬੰਧੀ ਜਾਣਕਾਰੀ ਉਪਲਬਧ ਹੋਣ \'ਤੇ ਇੱਥੇ ਦਿਖਾਈ ਦੇਵੇਗੀ।',
         dietPlanPlaceholder: 'ਖੁਰਾਕ ਯੋਜਨਾ ਯੋਗਤਾ ਜਾਣਕਾਰੀ ਉਪਲਬਧ ਹੋਣ \'ਤੇ ਇੱਥੇ ਦਿਖਾਈ ਦੇਵੇਗੀ।',
         ingredientsPlaceholder: 'ਕੋਈ ਸਮੱਗਰੀ ਸੂਚੀਬੱਧ ਨਹੀਂ ਹੈ।',
         instructionsPlaceholder: 'ਕੋਈ ਨਿਰਦੇਸ਼ ਉਪਲਬਧ ਨਹੀਂ ਹਨ।',
         imagePromptLabel: 'ਚਿੱਤਰ ਪ੍ਰੋਂਪਟ',
         errorLoadingTitle: 'ਵਿਅੰਜਨ ਲੋਡ ਕਰਨ ਵਿੱਚ ਗਲਤੀ',
         errorLoadingMessage: 'ਇਸ ਵਿਅੰਜਨ ਦੇ ਵੇਰਵੇ ਲੋਡ ਨਹੀਂ ਕੀਤੇ ਜਾ ਸਕੇ। ਇਹ ਗੁੰਮ ਹੋ ਸਕਦਾ ਹੈ ਜਾਂ ਲਿੰਕ ਗਲਤ ਹੋ ਸਕਦਾ ਹੈ।',
       },
      toast: {
          formClearedTitle: 'ਫਾਰਮ ਸਾਫ਼ ਕੀਤਾ ਗਿਆ',
          formClearedDesc: 'ਨਵੀਂ ਸਮੱਗਰੀ ਲਈ ਤਿਆਰ!',
          recipeSavedTitle: 'ਵਿਅੰਜਨ ਸੁਰੱਖਿਅਤ ਕੀਤਾ ਗਿਆ!',
          recipeSavedDesc: '{recipeName} ਤੁਹਾਡੇ ਮਨਪਸੰਦਾਂ ਵਿੱਚ ਸ਼ਾਮਲ ਕੀਤਾ ਗਿਆ ਹੈ (ਸਿਮੂਲੇਸ਼ਨ)।',
          noRecipesTitle: 'ਕੋਈ ਵਿਅੰਜਨ ਨਹੀਂ ਮਿਲਿਆ',
          noRecipesDesc: 'ਦਿੱਤੀ ਗਈ ਸਮੱਗਰੀ ਅਤੇ ਤਰਜੀਹਾਂ ਨਾਲ ਕੋਈ ਵਿਅੰਜਨ ਨਹੀਂ ਲੱਭ ਸਕਿਆ। ਆਪਣੇ ਇਨਪੁਟ ਨੂੰ ਵਿਵਸਥਿਤ ਕਰਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
          recipesFoundTitle: 'ਵਿਅੰਜਨ ਮਿਲੇ!',
          recipesFoundDesc: 'ਸਾਨੂੰ ਤੁਹਾਡੇ ਲਈ {count} ਵਿਅੰਜਨ ਸੁਝਾਅ ਮਿਲੇ ਹਨ।',
          errorTitle: 'ਗਲਤੀ',
          genericError: 'ਵਿਅੰਜਨ ਸੁਝਾਉਣ ਵਿੱਚ ਅਸਫਲ। ਕਿਰਪਾ ਕਰਕੇ ਬਾਅਦ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
          validationError: 'ਇਨਪੁਟ ਪ੍ਰਮਾਣਿਕਤਾ ਅਸਫਲ ਰਹੀ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀਆਂ ਐਂਟਰੀਆਂ ਦੀ ਜਾਂਚ ਕਰੋ।',
      },
      footer: {
          builtWith: '❤️ ਦੁਆਰਾ ਬਣਾਇਆ ਗਿਆ ',
          poweredBy: 'ਜੈਮਿਨੀ ਦੁਆਰਾ ਸੰਚਾਲਿਤ।',
          copyright: '© {year} ਰੈਸਿਪੀਸੇਜ। ਸਾਰੇ ਅਧਿਕਾਰ ਰਾਖਵੇਂ ਹਨ (ਅਸਲ ਵਿੱਚ ਨਹੀਂ)।',
      },
  },
  ja: {
      appTitle: 'レシピセージ',
      loadingMessage: 'おいしいアイデアを生成中...',
      quickModePreference: 'クイックミール（30分未満）',
      servingSizePreference: '{count}人分',
      languageSelector: {
          ariaLabel: '言語を選択',
          placeholder: '言語',
          tooltip: '言語を選択',
      },
      themeSelector: {
          ariaLabel: 'テーマを切り替え',
          tooltip: 'テーマを変更',
          light: 'ライト',
          dark: 'ダーク',
          system: 'システム',
      },
      hero: {
          title: 'あなたの内なるシェフを解き放て！',
          subtitle: '手持ちの材料を入力し、好みを加えて、レシピセージがあなたにぴったりの次のおいしい食事を見つけます。',
      },
      form: {
          title: 'レシピを探す',
          description: '何を持っていて、何が好きか教えてください。残りは私たちが処理します！',
          ingredientsLabel: '利用可能な材料',
          ingredientsPlaceholder: '例：鶏むね肉、ブロッコリー、醤油、米、にんにく...',
          ingredientsError: '少なくともいくつかの材料を入力してください。',
          dietaryRestrictionsLabel: '食事制限',
          dietaryRestrictionsPlaceholder: '例：ベジタリアン、グルテンフリー',
          preferencesLabel: 'その他の好み',
          preferencesPlaceholder: '例：辛い、イタリア料理、ヘルシー',
          quickModeLabel: 'クイックモード？',
          quickModeHint: '（30分未満）',
          quickModeAriaLabel: 'クイックモード（30分未満）',
          servingSizeLabel: 'サービング',
          servingSizePlaceholder: '例：2',
          cuisineTypeLabel: '料理の種類', // New field
          cuisineTypePlaceholder: '例：インド料理、メキシコ料理、タイ料理', // New field
          cookingMethodLabel: '調理法', // New field
          cookingMethodPlaceholder: '例：焼く、炒める、グリルする', // New field
          includeDetailsLabel: '詳細を含める？',
          includeDetailsHint: '（栄養/食事）',
          includeDetailsAriaLabel: '栄養成分表示と食事プランの適合性を含める',
          submitButton: '提案を取得',
          submitButtonLoading: 'レシピを検索中...',
          resetButton: 'フォームをクリア',
          footerNote: 'AIは入力に基づいて提案を生成します。結果は異なる場合があります。アレルギーを再確認してください！',
      },
      results: {
          title: 'あなたのレシピ提案',
          imageAlt: '{recipeName} の生成画像',
          saveButtonAriaLabel: 'レシピを保存',
          saveButtonTooltip: 'レシピを保存',
          ingredientsTitle: '材料',
          instructionsTitle: '作り方',
          noRecipesFoundTitle: 'あなたの基準に一致するレシピは見つかりませんでした。',
          noRecipesFoundSuggestion: 'より良い結果を得るために、材料や好みを調整してみてください！',
          defaultDescription: 'あなたの材料に基づいたおいしいレシピの提案。',
          viewRecipeButton: 'レシピを見る',
      },
       recipeDetail: {
         backButton: '提案に戻る',
         nutritionTitle: '栄養成分表示（推定）',
         dietPlanTitle: '食事プラン適合性',
         nutritionPlaceholder: '栄養情報が利用可能な場合はここに表示されます。',
         dietPlanPlaceholder: '食事プランの適合性情報が利用可能な場合はここに表示されます。',
         ingredientsPlaceholder: '材料はリストされていません。',
         instructionsPlaceholder: '作り方は利用できません。',
         imagePromptLabel: '画像プロンプト',
         errorLoadingTitle: 'レシピの読み込みエラー',
         errorLoadingMessage: 'このレシピの詳細を読み込めませんでした。見つからないか、リンクが間違っている可能性があります。',
       },
      toast: {
          formClearedTitle: 'フォームがクリアされました',
          formClearedDesc: '新しい材料の準備ができました！',
          recipeSavedTitle: 'レシピが保存されました！',
          recipeSavedDesc: '{recipeName} がお気に入りに追加されました（シミュレーション）。',
          noRecipesTitle: 'レシピが見つかりません',
          noRecipesDesc: '指定された材料と好みでレシピが見つかりませんでした。入力を調整してみてください。',
          recipesFoundTitle: 'レシピが見つかりました！',
          recipesFoundDesc: 'あなたのために {count} 件のレシピ提案が見つかりました。',
          errorTitle: 'エラー',
          genericError: 'レシピの提案に失敗しました。後でもう一度お試しください。',
          validationError: '入力検証に失敗しました。エントリを確認してください。',
      },
      footer: {
          builtWith: '❤️ で作成 ',
          poweredBy: 'Gemini を搭載。',
          copyright: '© {year} レシピセージ。無断転載禁止（実際にはそうではありません）。',
      },
  },
  es: {
    appTitle: 'RecipeSage',
    loadingMessage: 'Generando ideas deliciosas...',
    quickModePreference: 'comida rápida (menos de 30 minutos)',
    servingSizePreference: 'para {count} personas',
    languageSelector: {
      ariaLabel: 'Seleccionar idioma',
      placeholder: 'Idioma',
      tooltip: 'Seleccionar Idioma',
    },
    themeSelector: {
      ariaLabel: 'Cambiar tema',
      tooltip: 'Cambiar Tema',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
    },
    hero: {
      title: '¡Libera tu Chef Interior!',
      subtitle: 'Introduce los ingredientes que tienes, añade preferencias y deja que RecipeSage encuentre tu próxima comida deliciosa, hecha a tu medida.',
    },
    form: {
      title: 'Encontrar Recetas',
      description: 'Dinos qué tienes y qué te gusta. ¡Nosotros nos encargamos del resto!',
      ingredientsLabel: 'Ingredientes Disponibles',
      ingredientsPlaceholder: 'ej., pechuga de pollo, brócoli, salsa de soja, arroz, ajo...',
      ingredientsError: 'Por favor, introduce al menos algunos ingredientes.',
      dietaryRestrictionsLabel: 'Restricciones Dietéticas',
      dietaryRestrictionsPlaceholder: 'ej., vegetariano, sin gluten',
      preferencesLabel: 'Otras Preferencias',
      preferencesPlaceholder: 'ej., picante, cocina italiana, saludable',
      quickModeLabel: '¿Modo Rápido?',
      quickModeHint: '(Menos de 30 min)',
      quickModeAriaLabel: 'Modo rápido (menos de 30 minutos)',
      servingSizeLabel: 'Porciones',
      servingSizePlaceholder: 'ej., 2',
      cuisineTypeLabel: 'Tipo de Cocina', // New field
      cuisineTypePlaceholder: 'ej., india, mexicana, tailandesa', // New field
      cookingMethodLabel: 'Método de Cocción', // New field
      cookingMethodPlaceholder: 'ej., hornear, saltear, asar a la parrilla', // New field
      includeDetailsLabel: '¿Incluir Detalles?',
      includeDetailsHint: '(Nutrición/Dieta)',
      includeDetailsAriaLabel: 'Incluir información nutricional y adecuación al plan de dieta',
      submitButton: 'Obtener Sugerencias',
      submitButtonLoading: 'Buscando Recetas...',
      resetButton: 'Limpiar Formulario',
      footerNote: 'La IA genera sugerencias basadas en tu entrada. Los resultados pueden variar. ¡Verifica las alergias!',
    },
    results: {
      title: 'Tus Sugerencias de Recetas',
      imageAlt: 'Imagen generada para {recipeName}',
      saveButtonAriaLabel: 'Guardar receta',
      saveButtonTooltip: 'Guardar Receta',
      ingredientsTitle: 'Ingredientes',
      instructionsTitle: 'Instrucciones',
      noRecipesFoundTitle: 'No se encontraron recetas que coincidan con tus criterios.',
      noRecipesFoundSuggestion: '¡Intenta ajustar tus ingredientes o preferencias para tener más suerte!',
      defaultDescription: 'Una deliciosa sugerencia de receta basada en tus ingredientes.',
      viewRecipeButton: 'Ver Receta',
    },
     recipeDetail: {
       backButton: 'Volver a Sugerencias',
       nutritionTitle: 'Información Nutricional (Estimada)',
       dietPlanTitle: 'Adecuación al Plan de Dieta',
       nutritionPlaceholder: 'La información nutricional aparecerá aquí si está disponible.',
       dietPlanPlaceholder: 'La información sobre la adecuación al plan de dieta aparecerá aquí si está disponible.',
       ingredientsPlaceholder: 'No hay ingredientes listados.',
       instructionsPlaceholder: 'No hay instrucciones disponibles.',
       imagePromptLabel: 'Prompt de Imagen',
       errorLoadingTitle: 'Error al Cargar la Receta',
       errorLoadingMessage: 'No se pudieron cargar los detalles de esta receta. Puede que falte o que el enlace sea incorrecto.',
     },
    toast: {
      formClearedTitle: 'Formulario Limpiado',
      formClearedDesc: '¡Listo para nuevos ingredientes!',
      recipeSavedTitle: '¡Receta Guardada!',
      recipeSavedDesc: '{recipeName} ha sido añadida a tus favoritos (simulación).',
      noRecipesTitle: 'No se Encontraron Recetas',
      noRecipesDesc: 'No se pudieron encontrar recetas con los ingredientes y preferencias dados. Intenta ajustar tu entrada.',
      recipesFoundTitle: '¡Recetas Encontradas!',
      recipesFoundDesc: 'Encontramos {count} sugerencia{s} de recetas para ti.',
      errorTitle: 'Error',
      genericError: 'Fallo al sugerir recetas. Por favor, inténtalo de nuevo más tarde.',
      validationError: 'Falló la validación de entrada. Por favor, revisa tus entradas.',
    },
    footer: {
      builtWith: 'Hecho con ❤️ por ',
      poweredBy: 'Potenciado por Gemini.',
      copyright: '© {year} RecipeSage. Todos los derechos reservados (no realmente).',
    },
  },
  fr: {
    appTitle: 'RecipeSage',
    loadingMessage: 'Génération d\'idées délicieuses...',
    quickModePreference: 'repas rapide (moins de 30 minutes)',
    servingSizePreference: 'pour {count} personnes',
    languageSelector: {
      ariaLabel: 'Sélectionner la langue',
      placeholder: 'Langue',
      tooltip: 'Sélectionner la Langue',
    },
    themeSelector: {
      ariaLabel: 'Changer de thème',
      tooltip: 'Changer de Thème',
      light: 'Clair',
      dark: 'Sombre',
      system: 'Système',
    },
    hero: {
      title: 'Libérez le Chef qui est en Vous !',
      subtitle: 'Entrez les ingrédients que vous avez, ajoutez vos préférences, et laissez RecipeSage trouver votre prochain repas délicieux, adapté spécialement pour vous.',
    },
    form: {
      title: 'Trouver des Recettes',
      description: 'Dites-nous ce que vous avez et ce que vous aimez. Nous nous occupons du reste !',
      ingredientsLabel: 'Ingrédients Disponibles',
      ingredientsPlaceholder: 'ex: blanc de poulet, brocoli, sauce soja, riz, ail...',
      ingredientsError: 'Veuillez entrer au moins quelques ingrédients.',
      dietaryRestrictionsLabel: 'Restrictions Alimentaires',
      dietaryRestrictionsPlaceholder: 'ex: végétarien, sans gluten',
      preferencesLabel: 'Autres Préférences',
      preferencesPlaceholder: 'ex: épicé, cuisine italienne, sain',
      quickModeLabel: 'Mode Rapide ?',
      quickModeHint: '(Moins de 30 min)',
      quickModeAriaLabel: 'Mode rapide (moins de 30 minutes)',
      servingSizeLabel: 'Portions',
      servingSizePlaceholder: 'ex: 2',
      cuisineTypeLabel: 'Type de Cuisine', // New field
      cuisineTypePlaceholder: 'ex: indienne, mexicaine, thaïlandaise', // New field
      cookingMethodLabel: 'Méthode de Cuisson', // New field
      cookingMethodPlaceholder: 'ex: cuisson au four, sauté, grill', // New field
      includeDetailsLabel: 'Inclure les Détails ?',
      includeDetailsHint: '(Nutrition/Régime)',
      includeDetailsAriaLabel: 'Inclure les informations nutritionnelles et la compatibilité avec le régime alimentaire',
      submitButton: 'Obtenir des Suggestions',
      submitButtonLoading: 'Recherche de Recettes...',
      resetButton: 'Effacer le Formulaire',
      footerNote: 'L\'IA génère des suggestions basées sur votre saisie. Les résultats peuvent varier. Vérifiez bien les allergies !',
    },
    results: {
      title: 'Vos Suggestions de Recettes',
      imageAlt: 'Image générée pour {recipeName}',
      saveButtonAriaLabel: 'Enregistrer la recette',
      saveButtonTooltip: 'Enregistrer la Recette',
      ingredientsTitle: 'Ingrédients',
      instructionsTitle: 'Instructions',
      noRecipesFoundTitle: 'Aucune recette correspondant à vos critères n\'a été trouvée.',
      noRecipesFoundSuggestion: 'Essayez d\'ajuster vos ingrédients ou préférences pour avoir plus de chance !',
      defaultDescription: 'Une suggestion de recette délicieuse basée sur vos ingrédients.',
      viewRecipeButton: 'Voir la Recette',
    },
    recipeDetail: {
       backButton: 'Retour aux Suggestions',
       nutritionTitle: 'Informations Nutritionnelles (Estimées)',
       dietPlanTitle: 'Compatibilité avec le Régime Alimentaire',
       nutritionPlaceholder: 'Les informations nutritionnelles apparaîtront ici si disponibles.',
       dietPlanPlaceholder: 'Les informations sur la compatibilité avec le régime alimentaire apparaîtront ici si disponibles.',
       ingredientsPlaceholder: 'Aucun ingrédient listé.',
       instructionsPlaceholder: 'Aucune instruction disponible.',
       imagePromptLabel: 'Prompt d\'Image',
       errorLoadingTitle: 'Erreur de Chargement de la Recette',
       errorLoadingMessage: 'Impossible de charger les détails de cette recette. Elle est peut-être manquante ou le lien est incorrect.',
     },
    toast: {
      formClearedTitle: 'Formulaire Effacé',
      formClearedDesc: 'Prêt pour de nouveaux ingrédients !',
      recipeSavedTitle: 'Recette Enregistrée !',
      recipeSavedDesc: '{recipeName} a été ajoutée à vos favoris (simulation).',
      noRecipesTitle: 'Aucune Recette Trouvée',
      noRecipesDesc: 'Impossible de trouver des recettes avec les ingrédients et préférences donnés. Essayez d\'ajuster votre saisie.',
      recipesFoundTitle: 'Recettes Trouvées !',
      recipesFoundDesc: 'Nous avons trouvé {count} suggestion{s} de recette pour vous.',
      errorTitle: 'Erreur',
      genericError: 'Échec de la suggestion de recettes. Veuillez réessayer plus tard.',
      validationError: 'La validation de l\'entrée a échoué. Veuillez vérifier vos saisies.',
    },
    footer: {
      builtWith: 'Construit avec ❤️ par ',
      poweredBy: 'Propulsé par Gemini.',
      copyright: '© {year} RecipeSage. Tous droits réservés (pas vraiment).',
    },
  },
};
