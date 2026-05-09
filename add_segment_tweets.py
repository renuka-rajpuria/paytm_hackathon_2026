import json

with open("tweets_output.json", encoding="utf-8") as f:
    data = json.load(f)

segment_tweets = [
  # Payment Gateway
  {
    "tweet_id": "2099100000000000001", "conversation_id": "2099100000000000001",
    "created_at": "Sat May 09 11:30:00 +0000 2026",
    "full_text": "Our entire checkout is broken. Paytm Payment Gateway is failing for ALL transactions on our platform. We are losing lakhs per hour. @Paytm @Paytmcare this needs IMMEDIATE escalation. Switching to Razorpay if not resolved in 2 hours. #PaytmPG #PaymentGateway",
    "lang": "en", "likes": 234, "retweets": 178, "replies": 89, "quotes": 34, "bookmarks": 56, "views": 42000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmPG", "PaymentGateway"],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}],
    "urls": [], "media_urls": [], "source": "Twitter Web App",
    "user": {"user_id": "9920000001", "name": "ShopEasy India", "screen_name": "shopeasyin", "location": "Bangalore, India", "description": "India's fastest growing D2C platform | 2M+ customers", "followers": 28400, "following": 340, "tweet_count": 5600, "is_verified": False, "is_blue_verified": True, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=ShopEasy", "created_at": "Mon Mar 12 09:00:00 +0000 2018"}
  },
  {
    "tweet_id": "2099100000000000002", "conversation_id": "2099100000000000002",
    "created_at": "Sat May 09 11:35:00 +0000 2026",
    "full_text": "Merchant settlement from @Paytm delayed by 3 days again. This is the 4th time this month. Our working capital is stuck. @Paytmcare please escalate to settlements team. TID: PMTSETL2026050801. #PaytmMerchant",
    "lang": "en", "likes": 67, "retweets": 23, "replies": 18, "quotes": 4, "bookmarks": 12, "views": 5400,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmMerchant"],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}, {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {"user_id": "9920000002", "name": "Rajesh Stores", "screen_name": "rajeshshops_hyd", "location": "Hyderabad", "description": "Electronics retailer | Paytm merchant since 2017", "followers": 1240, "following": 280, "tweet_count": 890, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=RajeshStores", "created_at": "Thu Aug 10 07:00:00 +0000 2017"}
  },
  # B2B
  {
    "tweet_id": "2099100000000000003", "conversation_id": "2099100000000000003",
    "created_at": "Sat May 09 11:40:00 +0000 2026",
    "full_text": "Bulk vendor payment of Rs 18 lakh initiated via @Paytm Business 3 days ago — still showing 'processing'. Vendors are threatening to stop supply. @Paytmcare this is critical for our supply chain. Ref: PAYTMB2B20260506789",
    "lang": "en", "likes": 89, "retweets": 45, "replies": 31, "quotes": 8, "bookmarks": 19, "views": 11200,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": [],
    "mentions": [{"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter Web App",
    "user": {"user_id": "9920000003", "name": "Mehta Textiles Ltd", "screen_name": "mehtatextiles", "location": "Surat, Gujarat", "description": "Textile manufacturer | 500+ employees | Exporter", "followers": 4300, "following": 210, "tweet_count": 1200, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=MehtaTextiles", "created_at": "Mon Jan 06 10:00:00 +0000 2020"}
  },
  # B2B Lending
  {
    "tweet_id": "2099100000000000004", "conversation_id": "2099100000000000004",
    "created_at": "Sat May 09 11:45:00 +0000 2026",
    "full_text": "Applied for Paytm Business Loan 3 weeks ago. Documents verified, CIBIL checked, everything approved — but disbursement still pending. @Paytm @Paytmcare my business is suffering without this working capital. What is going on?",
    "lang": "en", "likes": 112, "retweets": 38, "replies": 27, "quotes": 5, "bookmarks": 23, "views": 9800,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": [],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}, {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {"user_id": "9920000004", "name": "Pavan Kumar", "screen_name": "pavankumar_smb", "location": "Coimbatore, TN", "description": "Small business owner | Garment exports", "followers": 780, "following": 340, "tweet_count": 650, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=PavanKumar", "created_at": "Fri Apr 17 11:00:00 +0000 2020"}
  },
  {
    "tweet_id": "2099100000000000005", "conversation_id": "2099100000000000005",
    "created_at": "Sat May 09 11:50:00 +0000 2026",
    "full_text": "Paytm Business Loan EMI was auto-debited TWICE this month from my account. Rs 42,000 extra deducted. @Paytmcare raised complaint 5 days ago, no reversal yet. This is daylight robbery. Going to RBI ombudsman. @RBI",
    "lang": "en", "likes": 198, "retweets": 112, "replies": 67, "quotes": 18, "bookmarks": 41, "views": 24000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": [],
    "mentions": [{"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter for iPhone",
    "user": {"user_id": "9920000005", "name": "Divya Nambiar", "screen_name": "divyanambiar_kochi", "location": "Kochi, Kerala", "description": "Restaurant owner | Food entrepreneur", "followers": 3200, "following": 420, "tweet_count": 2100, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=DivyaNambiar", "created_at": "Tue Feb 18 08:00:00 +0000 2019"}
  },
  # Gold
  {
    "tweet_id": "2099100000000000006", "conversation_id": "2099100000000000006",
    "created_at": "Sat May 09 11:55:00 +0000 2026",
    "full_text": "I bought digital gold on @Paytm at Rs 7,240/gram but the price shown now is Rs 7,180/gram — that's a Rs 600 difference in 10 minutes. The buy price seems artificially inflated. Where is the price transparency? @Paytmcare #DigitalGold #PaytmGold",
    "lang": "en", "likes": 145, "retweets": 67, "replies": 43, "quotes": 11, "bookmarks": 28, "views": 18000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["DigitalGold", "PaytmGold"],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}, {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter Web App",
    "user": {"user_id": "9920000006", "name": "Amrita Iyer", "screen_name": "amritaiyer_inv", "location": "Chennai, India", "description": "Personal finance | Investment blogger | 50k readers", "followers": 52000, "following": 890, "tweet_count": 8900, "is_verified": False, "is_blue_verified": True, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=AmritaIyer", "created_at": "Wed May 09 07:00:00 +0000 2018"}
  },
  {
    "tweet_id": "2099100000000000007", "conversation_id": "2099100000000000007",
    "created_at": "Sat May 09 12:00:00 +0000 2026",
    "full_text": "Requested gold redemption on @Paytm 2 weeks ago. Still not delivered. Customer support says it takes 7 days. It's been 14 days. Gold worth Rs 82,000 is stuck. @Paytmcare please resolve urgently. #PaytmGold",
    "lang": "en", "likes": 167, "retweets": 93, "replies": 54, "quotes": 14, "bookmarks": 33, "views": 22000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmGold"],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}, {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {"user_id": "9920000007", "name": "Girish Menon", "screen_name": "girishmenon_blr", "location": "Bangalore, India", "description": "IT professional | Gold investor", "followers": 1890, "following": 410, "tweet_count": 1400, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=GirishMenon", "created_at": "Mon Jul 08 10:00:00 +0000 2019"}
  },
  # Flights
  {
    "tweet_id": "2099100000000000008", "conversation_id": "2099100000000000008",
    "created_at": "Sat May 09 12:05:00 +0000 2026",
    "full_text": "Booked flight tickets on @Paytm for 4 people — Rs 28,000 deducted, payment successful, but NO booking confirmation received. Flight is tomorrow! @Paytmcare this is urgent. PNR not generated. What do I do?? #PaytmFlights",
    "lang": "en", "likes": 312, "retweets": 198, "replies": 121, "quotes": 44, "bookmarks": 67, "views": 48000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmFlights"],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}, {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter for iPhone",
    "user": {"user_id": "9920000008", "name": "Kavitha Reddy", "screen_name": "kavithareddy_hyd", "location": "Hyderabad, India", "description": "Working mom | Travel enthusiast", "followers": 2100, "following": 530, "tweet_count": 3400, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=KavithaReddy", "created_at": "Thu Mar 22 08:30:00 +0000 2018"}
  },
  {
    "tweet_id": "2099100000000000009", "conversation_id": "2099100000000000009",
    "created_at": "Sat May 09 12:10:00 +0000 2026",
    "full_text": "Flight cancelled by airline but @Paytm refund still not processed after 12 days. Amount: Rs 14,500. Policy says 7 working days. Raised 3 tickets, all closed without resolution. @Paytmcare I need escalation.",
    "lang": "en", "likes": 89, "retweets": 41, "replies": 28, "quotes": 6, "bookmarks": 14, "views": 8900,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": [],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}, {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter Web App",
    "user": {"user_id": "9920000009", "name": "Nikhil Sharma", "screen_name": "nikhilsharma_del", "location": "New Delhi, India", "description": "Frequent flyer | Startup advisor", "followers": 4600, "following": 620, "tweet_count": 6200, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=NikhilSharma", "created_at": "Fri Jan 15 11:00:00 +0000 2016"}
  },
  # Hotels
  {
    "tweet_id": "2099100000000000010", "conversation_id": "2099100000000000010",
    "created_at": "Sat May 09 12:15:00 +0000 2026",
    "full_text": "Booked a hotel via @Paytm Travel for our anniversary trip. Reached the hotel — they have NO record of the booking. Rs 9,800 paid. @Paytmcare this is completely unacceptable. We are standing at reception with no room. #PaytmHotels",
    "lang": "en", "likes": 278, "retweets": 167, "replies": 98, "quotes": 32, "bookmarks": 54, "views": 38000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmHotels"],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}, {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter for iPhone",
    "user": {"user_id": "9920000010", "name": "Preethi Subramaniam", "screen_name": "preethisub_mum", "location": "Mumbai, India", "description": "Content creator | Travel & lifestyle", "followers": 12800, "following": 780, "tweet_count": 7800, "is_verified": False, "is_blue_verified": True, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=PreethiSub", "created_at": "Sat Jun 08 09:00:00 +0000 2019"}
  },
  # Insurance
  {
    "tweet_id": "2099100000000000011", "conversation_id": "2099100000000000011",
    "created_at": "Sat May 09 12:20:00 +0000 2026",
    "full_text": "Filed a health insurance claim through @Paytm Insurance 45 days ago. Claim approved by insurer but payout still not received. @Paytmcare I have hospital bills pending. This is causing serious financial stress. Please help. #PaytmInsurance",
    "lang": "en", "likes": 134, "retweets": 78, "replies": 42, "quotes": 9, "bookmarks": 27, "views": 16000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmInsurance"],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}, {"screen_name": "Paytmcare", "name": "Paytm Care", "id": "2475273985"}],
    "urls": [], "media_urls": [], "source": "Twitter for Android",
    "user": {"user_id": "9920000011", "name": "Sanjay Bhatt", "screen_name": "sanjaybhatt_ahm", "location": "Ahmedabad, India", "description": "Teacher | Family man", "followers": 560, "following": 230, "tweet_count": 430, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=SanjayBhatt", "created_at": "Wed Mar 05 10:00:00 +0000 2020"}
  },
  {
    "tweet_id": "2099100000000000012", "conversation_id": "2099100000000000012",
    "created_at": "Sat May 09 12:25:00 +0000 2026",
    "full_text": "Impressed with @Paytm Insurance — bought term insurance in under 5 minutes, completely paperless. Premium was 20% cheaper than what I got from the insurer directly. The comparison tool is great. #PaytmInsurance #TermInsurance",
    "lang": "en", "likes": 198, "retweets": 54, "replies": 22, "quotes": 7, "bookmarks": 34, "views": 12000,
    "is_reply": False, "in_reply_to_tweet_id": None, "in_reply_to_screen_name": None,
    "hashtags": ["PaytmInsurance", "TermInsurance"],
    "mentions": [{"screen_name": "Paytm", "name": "Paytm", "id": "144792607"}],
    "urls": [], "media_urls": [], "source": "Twitter for iPhone",
    "user": {"user_id": "9920000012", "name": "Ankur Jha", "screen_name": "ankurjha_mum", "location": "Mumbai, India", "description": "Finance professional | FIRE journey", "followers": 6700, "following": 380, "tweet_count": 3200, "is_verified": False, "is_blue_verified": False, "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=AnkurJha", "created_at": "Mon Aug 19 07:00:00 +0000 2019"}
  },
]

data["tweets"].extend(segment_tweets)
data["meta"]["total"] = len(data["tweets"])

with open("tweets_output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Done. Total tweets: {len(data['tweets'])}")
