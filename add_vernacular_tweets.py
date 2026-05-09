import json

vernacular_tweets = [
  {
    "tweet_id": "vern_001",
    "conversation_id": "vern_001",
    "created_at": "Sat May 09 04:10:00 +0000 2026",
    "full_text": "@Paytm @Paytmcare मेरा ₹5,000 का UPI पेमेंट फेल हो गया लेकिन मेरे बैंक अकाउंट से पैसे कट गए! 4 घंटे से कोई रिफंड नहीं आया। यह बहुत बड़ी धोखाधड़ी है! बच्चों की स्कूल फीस देनी थी आज। #PaytmFailed #UPIFraud",
    "lang": "hi",
    "likes": 412, "retweets": 198, "replies": 87, "quotes": 34, "bookmarks": 56, "views": 62000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmFailed", "UPIFraud"],
    "mentions": [
      {"screen_name": "Paytm", "name": "Paytm", "id": "144792607"},
      {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}
    ],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {
      "user_id": "u_vern_001", "name": "Ramesh Kumar", "screen_name": "ramesh_kumar_del",
      "location": "New Delhi, India", "description": "", "followers": 4800, "following": 312,
      "tweet_count": 892, "is_verified": False, "is_blue_verified": False,
      "avatar_url": None, "created_at": "Mon Jan 15 09:00:00 +0000 2018"
    }
  },
  {
    "tweet_id": "vern_002",
    "conversation_id": "vern_002",
    "created_at": "Sat May 09 05:30:00 +0000 2026",
    "full_text": "଎ன் @Paytm கணக்கிலிருந்து ₹8,000 போய்விட்டது ஆனால் merchant-க்கு கிடைக்கவில்லை! இரண்டு நாட்டாக refund இல்லை. @Paytmcare customer care எடுக்கவே இல்லை. Police complaint போடுவேன்! #PaytmScam #UPIFailed",
    "lang": "ta",
    "likes": 534, "retweets": 267, "replies": 112, "quotes": 45, "bookmarks": 78, "views": 88000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmScam", "UPIFailed"],
    "mentions": [
      {"screen_name": "Paytm", "name": "Paytm", "id": "144792607"},
      {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}
    ],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {
      "user_id": "u_vern_002", "name": "Karthik Selvam", "screen_name": "karthik_selvam_tn",
      "location": "Chennai, Tamil Nadu", "description": "", "followers": 7200, "following": 445,
      "tweet_count": 1540, "is_verified": False, "is_blue_verified": True,
      "avatar_url": None, "created_at": "Fri Mar 10 08:00:00 +0000 2017"
    }
  },
  {
    "tweet_id": "vern_003",
    "conversation_id": "vern_003",
    "created_at": "Sat May 09 03:15:00 +0000 2026",
    "full_text": "నా @Paytm account నుండి ₹12,000 రెండుసార్లు deduct అయ్యాయి ఒకే transaction కి! 6 గంటలుగా support respond అవ్వడం లేదు. ఇది పూర్తి మోసం. RBI కి complaint చేస్తాను! @Paytmcare #PaytmFraud #DigitalPaymentScam",
    "lang": "te",
    "likes": 389, "retweets": 201, "replies": 94, "quotes": 38, "bookmarks": 52, "views": 54000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmFraud", "DigitalPaymentScam"],
    "mentions": [
      {"screen_name": "Paytm", "name": "Paytm", "id": "144792607"},
      {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}
    ],
    "urls": [], "media_urls": [], "source": "Twitter for iPhone",
    "user": {
      "user_id": "u_vern_003", "name": "Venkat Reddy", "screen_name": "venkat_reddy_hyd",
      "location": "Hyderabad, Telangana", "description": "", "followers": 5600, "following": 289,
      "tweet_count": 673, "is_verified": False, "is_blue_verified": False,
      "avatar_url": None, "created_at": "Wed Jun 20 11:00:00 +0000 2019"
    }
  },
  {
    "tweet_id": "vern_004",
    "conversation_id": "vern_004",
    "created_at": "Fri May 08 22:45:00 +0000 2026",
    "full_text": "@Paytm আমার তিন হাজার পাঁচশো UPI পেমেন্ট ব্যর্থ হয়েছে কিন্তু টাকা কেটে নেওয়া হয়েছে! 4 দিন ধরে refund আসেনি। @Paytmcare শুধু ticket number দেয়, কোনো সমাধান নেই। এটা জালিয়াতি! #PaytmFailed",
    "lang": "bn",
    "likes": 278, "retweets": 134, "replies": 61, "quotes": 22, "bookmarks": 38, "views": 38000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmFailed"],
    "mentions": [
      {"screen_name": "Paytm", "name": "Paytm", "id": "144792607"},
      {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}
    ],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {
      "user_id": "u_vern_004", "name": "Suman Chatterjee", "screen_name": "suman_chatt_kol",
      "location": "Kolkata, West Bengal", "description": "", "followers": 3100, "following": 198,
      "tweet_count": 421, "is_verified": False, "is_blue_verified": False,
      "avatar_url": None, "created_at": "Tue Sep 05 07:30:00 +0000 2017"
    }
  },
  {
    "tweet_id": "vern_005",
    "conversation_id": "vern_005",
    "created_at": "Sat May 09 06:00:00 +0000 2026",
    "full_text": "माझ्या @Paytm wallet मधून ₹10,000 काढले गेले पण ते माझ्या account मध्ये नाही आणि merchant ला पण मिळाले नाही! @Paytmcare ला 10 वेळा call केला, काहीही झाले नाही. ही फसवणूक आहे! #PaytmScam",
    "lang": "mr",
    "likes": 445, "retweets": 223, "replies": 98, "quotes": 41, "bookmarks": 67, "views": 71000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmScam"],
    "mentions": [
      {"screen_name": "Paytm", "name": "Paytm", "id": "144792607"},
      {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}
    ],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {
      "user_id": "u_vern_005", "name": "Suresh Patil", "screen_name": "suresh_patil_pune",
      "location": "Pune, Maharashtra", "description": "", "followers": 8900, "following": 512,
      "tweet_count": 1230, "is_verified": False, "is_blue_verified": True,
      "avatar_url": None, "created_at": "Mon Apr 08 10:00:00 +0000 2019"
    }
  },
  {
    "tweet_id": "vern_006",
    "conversation_id": "vern_006",
    "created_at": "Fri May 08 20:30:00 +0000 2026",
    "full_text": "ನಮ್ಮ @Paytm account block ಆಗಿದೆ ಮತ್ತು ₹20,000 wallet ನಲ್ಲಿ ಸಿಕ್ಕಿಹಾಕಿಕೊಂಡಿದೆ! KYC complete ಮಾಡಿದ್ದೇನೆ ಆದರೆ 1 ವಾರದಿಂದ unblock ಆಗುತ್ತಿಲ್ಲ. @Paytmcare support ಯಾವುದೇ reply ಮಾಡುತ್ತಿಲ್ಲ! #PaytmDown",
    "lang": "kn",
    "likes": 312, "retweets": 156, "replies": 72, "quotes": 28, "bookmarks": 44, "views": 43000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmDown"],
    "mentions": [
      {"screen_name": "Paytm", "name": "Paytm", "id": "144792607"},
      {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}
    ],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {
      "user_id": "u_vern_006", "name": "Ravi Kumar BLR", "screen_name": "ravi_kumar_blr",
      "location": "Bengaluru, Karnataka", "description": "", "followers": 6400, "following": 387,
      "tweet_count": 958, "is_verified": False, "is_blue_verified": False,
      "avatar_url": None, "created_at": "Thu Nov 12 09:00:00 +0000 2020"
    }
  },
  {
    "tweet_id": "vern_007",
    "conversation_id": "vern_007",
    "created_at": "Sat May 09 02:00:00 +0000 2026",
    "full_text": "મારા @Paytm account માંથી ₹7,500 deduct થઈ ગયા UPI payment fail થઈ ગઈ! 2 દિવસ થઈ ગયા refund નથી આવ્યું. @Paytmcare customer care ફોન ઉઠાવતા નથી. ખૂબ ખોટું છે! RBI Ombudsman ને complaint કરીશ. #PaytmFraud",
    "lang": "gu",
    "likes": 267, "retweets": 128, "replies": 54, "quotes": 19, "bookmarks": 33, "views": 36000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmFraud"],
    "mentions": [
      {"screen_name": "Paytm", "name": "Paytm", "id": "144792607"},
      {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}
    ],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {
      "user_id": "u_vern_007", "name": "Mehul Shah", "screen_name": "mehul_shah_ahm",
      "location": "Ahmedabad, Gujarat", "description": "", "followers": 4200, "following": 267,
      "tweet_count": 534, "is_verified": False, "is_blue_verified": False,
      "avatar_url": None, "created_at": "Sat Aug 20 06:00:00 +0000 2016"
    }
  },
  {
    "tweet_id": "vern_008",
    "conversation_id": "vern_008",
    "created_at": "Sat May 09 07:00:00 +0000 2026",
    "full_text": "@Paytm @Paytmcare मेरा Paytm account अचानक बिना किसी कारण के बंद हो गया! Wallet में ₹15,000 फंसे हैं। KYC पहले से verified है। 1 हफ़्ते से support से कोई जवाब नहीं। यह पैसों की हेराफेरी है! #PaytmDown #WalletBlocked",
    "lang": "hi",
    "likes": 623, "retweets": 334, "replies": 156, "quotes": 67, "bookmarks": 89, "views": 95000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmDown", "WalletBlocked"],
    "mentions": [
      {"screen_name": "Paytm", "name": "Paytm", "id": "144792607"},
      {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}
    ],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {
      "user_id": "u_vern_008", "name": "Pradeep Sharma", "screen_name": "pradeep_sharma_up",
      "location": "Lucknow, UP", "description": "", "followers": 11200, "following": 678,
      "tweet_count": 2341, "is_verified": False, "is_blue_verified": True,
      "avatar_url": None, "created_at": "Tue Feb 14 08:00:00 +0000 2012"
    }
  },
]

with open("C:/Users/Renuka/Desktop/2026/paytm_hackathon/tweets_output.json", encoding="utf-8") as f:
    data = json.load(f)

data["tweets"].extend(vernacular_tweets)
data["meta"]["total"] = len(data["tweets"])

with open("C:/Users/Renuka/Desktop/2026/paytm_hackathon/tweets_output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done. Total tweets:", len(data["tweets"]))
