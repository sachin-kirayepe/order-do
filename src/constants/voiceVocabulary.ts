export type VoiceRegion =
  | 'marathi'
  | 'neutral'
  | 'english';

export interface RegionalPhrases {
  WELCOME: string;
  PHOTO_STEP: string;
  NAME_STEP: string;
  ADDRESS_STEP: string;
  ITEMS_STEP: string;
  PREVIEW_STEP: string;
  LIVENESS_BLINK: string;
  LIVENESS_SUCCESS: string;
  LIVENESS_FAILED: string;
  ORDER_ALERT_SHOP: (name: string, location: string, shortId: string) => string;
  ORDER_READY_SHOP: (name: string, shortId: string) => string;
  PAYMENT_SUCCESS: string;
  ORDER_CONFIRM: string;
  ANYTHING_ELSE: string;
  GREETING_MORNING: string;
  GREETING_EVENING: string;
  THANK_YOU: string;
  PLEASE_WAIT: string;
  RETRY_GENTLE: string;
  CAMERA_READY: string;
  ITEMS_ADDED: string;
  ORDER_PLACED: string;
  ORDER_ACCEPTED_CUSTOMER: string;
  ORDER_READY_CUSTOMER: (id: string) => string;
  ORDER_COMPLETED_CUSTOMER: string;
  REPORT_ARCHIVE_READY: string;
  REPORT_ARCHIVE_SUCCESS: string;
  REPORT_ARCHIVE_EMPTY: string;
  REPORT_ARCHIVE_ACTION: string;
}

export const VOICE_VOCABULARY: Record<VoiceRegion, RegionalPhrases> = {



  marathi: {
    WELCOME: "नमस्कार जी! ऑर्डर-दो मध्ये तुमचे खूप-खूप स्वागत आहे! चला, ऑर्डर सुरू करूया!",
    PHOTO_STEP: "ऐका ना जी, पहिले तुमचा एक खूप चांगला फोटो काढा ना! कॅमेरा समोर या ना, एकदम परफेक्ट!",
    NAME_STEP: "आता तुमचे नाव आणि फोन नंबर सांगा ना जी! मी वाट पाहतेय!",
    ADDRESS_STEP: "खूप छान जी! आता तुमचा पत्ता सांगा ना, म्हणजे सामान बरोबर पोहोचेल!",
    ITEMS_STEP: "अछा जी, लवकर आयटम्स निवडा ना! जे तुम्हाला पाहिजे ते सर्व सांगा, आम्ही नोट करतो!",
    PREVIEW_STEP: "फक्त एक सेकंद जी! बघून घ्या ना, सर्व बरोबर आहे ना? मग ऑर्डर कन्फर्म करू!",
    LIVENESS_BLINK: "ऐका ना जी, थोड्या नजरा झपका ना! बस एकदा, एकदम अश्या! चेक होतंय!",
    LIVENESS_SUCCESS: "अरे खूप छान! झालं जी! आता फोटो काढतोय! स्थिर राहा ना!",
    LIVENESS_FAILED: "काही नाही जी, वेळ संपला! पुन्हा प्रयत्न करा ना, होईल नक्की!",
    ORDER_ALERT_SHOP: (n, l, id) => `${n} जी यांचा ऑडर्र नंबर ${id} आला आहे! ${l} वरून।`,
    ORDER_READY_SHOP: (n, id) => `ऐका ना जी, ${n} यांचा ऑडर्र नंबर ${id} तयार आहे का?`,
    PAYMENT_SUCCESS: "खूप छान जी! पैसे मिळाले! आता ऑर्डर पाठवतो!",
    ORDER_CONFIRM: "खूप अछा जी! ऑर्डर कन्फर्म झाली आहे! निश्चिंत राहा, सर्व होईल!",
    ANYTHING_ELSE: "आणखी काही पाहिजे का जी? सांगा ना सांगा ना, आम्ही आहोत ना!",
    GREETING_MORNING: "सुप्रभात जी! आजचा दिवस छान जाईल!",
    GREETING_EVENING: "शुभ संध्या जी!",
    THANK_YOU: "खूप-खूप धन्यवाद जी! पुन्हा भेटूया, काळजी घ्या ना!",
    PLEASE_WAIT: "फक्त एक सेकंद जी, थोडा थांबा ना! होतंय आता!",
    RETRY_GENTLE: "काही नाही जी! पुन्हा प्रयत्न करा ना, होईल नक्की!",
    CAMERA_READY: "कॅमेरा तयार आहे जी! फोटोसाठी रेडी व्हा ना, स्माईल करा!",
    ITEMS_ADDED: "खूप छान! आयटम्स ॲड झाले जी! आणखी काही पाहिजे? सांगा ना!",
    ORDER_PLACED: "खूप छान जी! तुमची ऑर्डर मिळाली आहे! लवकरच मिळेल!",
    ORDER_ACCEPTED_CUSTOMER: "तुमची ऑर्डर स्वीकारली गेली आहे! आम्ही कामाला लागलो आहोत!",
    ORDER_READY_CUSTOMER: (id) => `आनंदाची बातमी! तुमचा ऑर्डर आयडी ${id} तयार आहे! कृपया काउंटरवरून घेऊन जा!`,
    ORDER_COMPLETED_CUSTOMER: "मौज करा! जेवणाचा आनंद घ्या और फीडबॅक द्यायला विसरू नका!",
    REPORT_ARCHIVE_READY: "ऐका ना जी, ३० दिवस जुनी रिपोर्ट आर्काइव करण्यासाठी तयार आहे! डाऊनलोड करा आणि क्लाउड फ्री करा ना!",
    REPORT_ARCHIVE_SUCCESS: "खूप छान जी! रिपोर्ट डाऊनलोड झाली आणि क्लाउड स्वच्छ झाला आहे!",
    REPORT_ARCHIVE_EMPTY: "काही काळजी नका जी, सध्या कोणतीही जुनी रिपोर्ट नाहीये!",
    REPORT_ARCHIVE_ACTION: "डाऊनलोड करा"
  },

  neutral: {
    WELCOME: "नमस्ते जी! ऑर्डर-दो में आपका बहुत प्यारा स्वागत है! चलिए ना, शुरू करते हैं!",
    PHOTO_STEP: "सुनिए ना जी, पहले एक अच्छी सी फोटो ले लीजिये! कैमरा के सामने आ जाइये ना!",
    NAME_STEP: "अब अपना नाम और फोन नंबर बता दीजिये ना जी! हम वेट कर रहे हैं!",
    ADDRESS_STEP: "बहुत अच्छा जी! अब एड्रेस बता दीजिये ना, ताकि सामान सही जगह पहुंचे!",
    ITEMS_STEP: "अच्छा अच्छा जी, जो जो चाहिए जी, जल्दी से चुन लीजिये ना! हम नोट कर रहे हैं!",
    PREVIEW_STEP: "बस एक सेकंड जी! चेक कर लो ना, सब ठीक है ना? फिर ऑर्डर कन्फर्म करते हैं!",
    LIVENESS_BLINK: "सुनिए ना जी प्लीज, आँखें झपका दीजिये ना! बस एक बार, बिलकुल ऐसे!",
    LIVENESS_SUCCESS: "बहुत बढ़िया! हो गया जी! अब फोटो ले रहे हैं! स्टेडी रहिये ना!",
    LIVENESS_FAILED: "कोई बात नहीं जी! फिर से ट्राई कीजिये ना, हो जायेगा पक्का!",
    ORDER_ALERT_SHOP: (n, l, id) => `${n} जी का ऑर्डर नंबर ${id} आया है! ${l} से।`,
    ORDER_READY_SHOP: (n, id) => `सुनिए ना जी, ${n} का ऑर्डर नंबर ${id} रेडी है क्या?`,
    PAYMENT_SUCCESS: "बहुत बढ़िया जी! पेमेंट हो गया! अब ऑर्डर प्रोसेस कर रहे हैं!",
    ORDER_CONFIRM: "बहुत अच्छा जी! ऑर्डर कन्फर्म हो गया है! बस वेट कीजिये ना!",
    ANYTHING_ELSE: "और कुछ चाहिए जी? बताइये ना बताइये ना, हम हैं ना!",
    GREETING_MORNING: "सुप्रभात जी! आज का दिन बहुत अच्छा होगा!",
    GREETING_EVENING: "शुभ संध्या जी!",
    THANK_YOU: "बहुत बहुत धन्यवाद जी! अपना ख्याल रखियेगा ना!",
    PLEASE_WAIT: "बस एक सेकंड जी, थोड़ा वेट कीजिये ना!",
    RETRY_GENTLE: "कोई बात नहीं जी! फिर से ट्राई कीजिये ना, हो जायेगा!",
    CAMERA_READY: "कैमरा तैयार है जी! फोटो के लिए रेडी हो जाइये ना!",
    ITEMS_ADDED: "बहुत बढ़िया! आइटम्स ॲड हो गए जी! और कुछ चाहिए?",
    ORDER_PLACED: "बहुत अच्छा जी! आपका ऑर्डर हमें मिल गया है! जल्दी मिल जायेगा!",
    ORDER_ACCEPTED_CUSTOMER: "आपका ऑर्डर स्वीकार कर लिया गया है! हम इसे तैयार कर रहे हैं!",
    ORDER_READY_CUSTOMER: (id) => `खुशखबरी! आपका ऑर्डर आईडी ${id} तैयार है! कृपया काउंटर से ले लीजिये!`,
    ORDER_COMPLETED_CUSTOMER: "मजे कीजिये! स्वाद का आनंद लें और फीडबैक देना ना भूलें!",
    REPORT_ARCHIVE_READY: "सुनिए ना जी, 30 दिन पुरानी रिपोर्ट आर्काइव करने के लिए तैयार है! डाउनलोड करें और क्लाउड फ्री करें ना!",
    REPORT_ARCHIVE_SUCCESS: "बहुत बढ़िया जी! रिपोर्ट डाउनलोड हो गयी और क्लाउड साफ़ कर दिया गया है!",
    REPORT_ARCHIVE_EMPTY: "कोई चिंता नहीं जी, अभी कोई पुरानी रिपोर्ट नहीं है!",
    REPORT_ARCHIVE_ACTION: "डाउनलोड करें"
  },

  english: {
    WELCOME: "Hello! Welcome to Order-Do! Let's get your order started, this is going to be wonderful!",
    PHOTO_STEP: "Alright, let's take a nice clear photo of you! Come a little closer to the camera, yes, perfect!",
    NAME_STEP: "Great! Now please tell us your name and phone number!",
    ADDRESS_STEP: "Wonderful! Now please share your delivery address!",
    ITEMS_STEP: "Now comes the fun part! Select the items you would like to order!",
    PREVIEW_STEP: "Just one second! Please review your order! Everything looks good?",
    LIVENESS_BLINK: "Alright, just blink your eyes naturally! Just once, yes, exactly!",
    LIVENESS_SUCCESS: "That was perfect! Verification is done! Capturing your photo now!",
    LIVENESS_FAILED: "No worries! Let's try that again, you've totally got this!",
    ORDER_ALERT_SHOP: (n, l, id) => `New order #${id} from ${n} at ${l}!`,
    ORDER_READY_SHOP: (n, id) => `Is order number ${id} for ${n} ready now?`,
    PAYMENT_SUCCESS: "That's wonderful! Payment received! We're processing your order right now!",
    ORDER_CONFIRM: "Your order is confirmed! Just sit back and relax, it's on its way!",
    ANYTHING_ELSE: "Is there anything else you need? Tell us, we're here for you!",
    GREETING_MORNING: "Good morning! Hope you have a wonderful day!",
    GREETING_EVENING: "Good evening! How was your day?",
    THANK_YOU: "Thank you so much! Take care, we'll see you again soon!",
    PLEASE_WAIT: "Just one second please! Almost done!",
    RETRY_GENTLE: "No worries! Let's try that again, it'll work this time!",
    CAMERA_READY: "Camera is ready! Get ready for your photo, and give us a nice smile!",
    ITEMS_ADDED: "Items have been added! Is there anything else you'd like?",
    ORDER_PLACED: "Order placed successfully! We're starting on it right now!",
    ORDER_ACCEPTED_CUSTOMER: "Your order has been accepted! We are preparing it with care.",
    ORDER_READY_CUSTOMER: (id) => `Good news! Your order ID ${id} is ready for pickup!`,
    ORDER_COMPLETED_CUSTOMER: "Enjoy your meal! We'd love to hear your feedback.",
    REPORT_ARCHIVE_READY: "Good news! Reports older than 30 days are ready to archive. Download them to keep your cloud clean!",
    REPORT_ARCHIVE_SUCCESS: "Success! Reports have been downloaded and cloud storage has been cleared.",
    REPORT_ARCHIVE_EMPTY: "No old reports found. Your cloud is already clean!",
    REPORT_ARCHIVE_ACTION: "Download Now"
  },
};
