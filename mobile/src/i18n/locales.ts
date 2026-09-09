export const locales = {
  en: {
    home: {
      greeting: 'Good morning, {{name}}',
      title: 'Better decisions for your farm',
      subtitleUser: 'Heres where things stand today.',
      subtitleGuest: 'Simple agricultural intelligence for every season.',
      tools: 'Tools',
      stats: { users: 'Users', crops: 'Crops', disease: 'Disease', fertilizer: 'Fertilizer' },
      cropTitle: 'Crop intelligence', cropBody: 'Predict the best crops from soil and climate readings',
      scanTitle: 'Soil report scan', scanBody: 'Upload a report and auto-fill crop inputs with OCR',
      aiTitle: 'Dhara AI', aiBody: 'Ask practical farming questions through the assistant',
      comingSoon: 'More crop health and fertilizer tools are coming soon.',
    },
    crop: {
      label: 'Crop guidance', title: 'Find the right crop',
      subtitle: 'Share a few details about your field and Dhara will suggest what can grow best.',
      manual: 'Enter values', scan: 'Scan report',
      scanTitle: 'Use a soil test report', scanBody: 'Upload a JPG, PNG, or PDF. We will read the values for you.',
      choose: 'Choose a report', extracted: '{{count}} fields extracted',
      readings: 'Field readings', submit: 'Show my best crops',
      error: 'Prediction failed. Check your inputs and backend connection.',
      matches: 'Best matches', matchPct: '{{pct}}% match for your field',
      fields: { nitrogen: 'Nitrogen N kg/ha', phosphorus: 'Phosphorus P kg/ha', potassium: 'Potassium K kg/ha', temperature: 'Temperature C', humidity: 'Humidity %', ph: 'pH level', rainfall: 'Rainfall mm' },
    },
    ai: {
      title: 'Ask Dhara', subtitle: 'Get simple, practical answers about crops, soil, and farming.',
      emptyTitle: 'What would you like to know?', emptyBody: 'Try "Which crop is best for sandy soil?"',
      placeholder: 'Ask about your farm...', ask: 'Ask',
      offline: 'I could not reach Dhara AI. Check the backend connection and try again.',
    },
    profile: {
      account: 'Your account', guestTitle: 'Your farm profile',
      guestBody: 'Sign in to save your farm details and get more useful guidance.',
      signIn: 'Sign in', createAccount: 'Create account',
      details: 'Farm details', name: 'Name', location: 'Location', landSize: 'Land size',
      save: 'Save profile', saved: 'Profile saved successfully.', saveError: 'Could not save profile.',
      logout: 'Log out',
    },
    activity: {
      about: 'About Dhara', title: 'Tools that grow with you',
      subtitle: 'Everything here is designed to make everyday farm decisions a little clearer.',
      predictionsTitle: 'AI-powered predictions', predictionsBody: 'Crop recommendations use your field details and our trained model.',
      diseaseTitle: 'Disease guidance', diseaseBody: 'A crop health tool is being prepared for a future update.',
      fertilizerTitle: 'Fertilizer guidance', fertilizerBody: 'Personalized fertilizer recommendations are coming soon.',
      missionTitle: 'Our mission', missionBody: 'Make agricultural intelligence practical, accessible, and useful for every farmer.',
      footer: 'Dhara: Knowledge • Intelligence • Services',
    },
    // inside locales.en, alongside your existing namespaces

    fertilizer: {
      label: 'Fertilizer guidance', title: 'Find the right fertilizer',
      subtitle: 'Tell us about your soil and crop to get a fertilizer recommendation.',
      soilType: 'Soil type', cropType: 'Crop type',
      nitrogen: 'Nitrogen', phosphorous: 'Phosphorous', potassium: 'Potassium',
      temperature: 'Temperature (°C)', moisture: 'Moisture (%)', rainfall: 'Rainfall (mm)',
      ph: 'pH level', carbon: 'Organic carbon (%)',
      submit: 'Recommend fertilizer', error: 'Could not get a recommendation. Check your inputs.',
      resultTitle: 'Recommended', quantity: 'Suggested quantity', confidence: '{{pct}}% confidence',
    },
    disease: {
      label: 'Crop health', title: 'Scan for disease',
      subtitle: 'Take or upload a photo of the affected leaf.',
      choosePhoto: 'Choose photo', takePhoto: 'Take photo',
      submit: 'Check for disease', error: 'Could not analyze the image. Try a clearer photo.',
      healthy: 'Healthy', confidence: '{{pct}}% confidence',
    },
    cropHub: {
      label: 'Crop tools', title: 'Everything for your crop',
      subtitle: 'Predict, feed, and protect — all in one place.',
      predictTitle: 'Predict best crop', predictBody: 'Get crop suggestions from soil and climate readings',
      fertilizerTitle: 'Fertilizer guidance', fertilizerBody: 'Get a fertilizer recommendation for your soil and crop',
      diseaseTitle: 'Disease scan', diseaseBody: 'Photograph a leaf to check for disease',
    },
  },
} satisfies Record<string, Record<string, unknown>>;

export type LocaleCode = keyof typeof locales;