import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Menu, X, Phone, MapPin, Clock, 
  ShieldCheck, Heart, Award 
} from 'lucide-react';


// Banners customized for ND JEWELLERS exact layout using Model Images
const bannerImages = [
  {
    url: '/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.46-pm.jpeg',
    pre: 'ND JEWELLERS',
    presents: 'PRSENTS',
    line1: 'A',
    line2: 'Lifetime',
    line3: 'OF',
    line4: 'Love',
    sub: 'Trusted by over 25,000+ customers in India, we offer exquisite gold jewellery designs and accurate gold rates.'
  },
  {
    url: '/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.46-pm-1.jpeg',
    pre: 'ND JEWELLERS',
    presents: 'PRSENTS',
    line1: 'THE',
    line2: 'Bridal',
    line3: 'OF',
    line4: 'Grace',
    sub: 'Exquisite hand-crafted chokers, necklaces, and heavy gold ornaments designed to make your wedding day royal.'
  },
  {
    url: '/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.47-pm.jpeg',
    pre: 'ND JEWELLERS',
    presents: 'PRSENTS',
    line1: 'AN',
    line2: 'Eternal',
    line3: 'OF',
    line4: 'Legacy',
    sub: 'Every cocktail ring and Polki statement piece is designed to tell a story of pure passion, luxury, and heritage.'
  },
  {
    url: '/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.47-pm-1.jpeg',
    pre: 'ND JEWELLERS',
    presents: 'PRSENTS',
    line1: 'THE',
    line2: 'Royal',
    line3: 'OF',
    line4: 'Style',
    sub: 'Step into a world of timeless luxury and premium gold designs carefully crafted by master artisans.'
  }
];


// Models from ZIPMODELS
const modelImages = [
  {
    url: '/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.46-pm.jpeg',
    title: 'Traditional Bridal Heritage',
    desc: 'Adorned in heavy gold choker necklaces, signature rings, and classic jumki earrings.'
  },
  {
    url: '/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.46-pm-1.jpeg',
    title: 'The Modern Queen',
    desc: 'Featuring royal temple jewelry with premium antique polish.'
  },
  {
    url: '/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.47-pm.jpeg',
    title: 'Festive Grace',
    desc: 'Dressed in gorgeous traditional red attire featuring handcrafted necklaces and gold bangles.'
  },
  {
    url: '/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.47-pm-1.jpeg',
    title: 'Regal Splendor',
    desc: 'A spectacular showcase of handcarved gold necklaces, intricate kadas, and statement jewelry.'
  }
];

// Bangles from ZIPBANGLES
const bangleImages = [
  {
    id: 'bangle-1',
    url: '/assets/ZIPBANGLES/whatsapp-image-2026-05-25-at-5.13.45-pm.jpeg',
    title: 'Royal Antique Kundan Kada',
    category: 'BANGLES',
    weight: '48.5 Grams',
    purity: '22K Hallmarked Gold'
  },
  {
    id: 'bangle-2',
    url: '/assets/ZIPBANGLES/whatsapp-image-2026-05-25-at-5.13.46-pm.jpeg',
    title: 'Imperial Peacock Filigree Kada',
    category: 'BANGLES',
    weight: '36.2 Grams',
    purity: '22K Hallmarked Gold'
  },
  {
    id: 'bangle-3',
    url: '/assets/ZIPBANGLES/whatsapp-image-2026-05-25-at-5.13.46-pm-1.jpeg',
    title: 'Traditional Polki Jadau Bangle Set',
    category: 'BANGLES',
    weight: '54.0 Grams',
    purity: '22K Hallmarked Gold'
  },
  {
    id: 'bangle-4',
    url: '/assets/ZIPBANGLES/whatsapp-image-2026-05-25-at-5.13.46-pm-2.jpeg',
    title: 'Luxury Gold-Beaded Kada',
    category: 'BANGLES',
    weight: '42.8 Grams',
    purity: '22K Hallmarked Gold'
  }
];

// Earrings from ZIPEARRINGS
const earringImages = [
  {
    id: 'earring-1',
    url: '/assets/ZIPEARRINGS/earring-3.jpeg',
    title: 'Heritage Royal Jhumka Set',
    category: 'EARRINGS',
    weight: '24.5 Grams',
    purity: '22K Hallmarked Gold'
  },
  {
    id: 'earring-2',
    url: '/assets/ZIPEARRINGS/earring-1.jpeg',
    title: 'Polki Chandbali Heritage Jhumki',
    category: 'EARRINGS',
    weight: '32.8 Grams',
    purity: '22K Hallmarked Gold'
  },
  {
    id: 'earring-3',
    url: '/assets/ZIPEARRINGS/earring-2.jpeg',
    title: 'Imperial Heavy Wedding Jhumkas',
    category: 'EARRINGS',
    weight: '41.2 Grams',
    purity: '22K Hallmarked Gold'
  },
  {
    id: 'earring-4',
    url: '/assets/ZIPEARRINGS/earring-4.jpeg',
    title: 'Elegant Antique Drop Earrings',
    category: 'EARRINGS',
    weight: '18.6 Grams',
    purity: '22K Hallmarked Gold'
  }
];

// Mangalsutra from ZIPMANGALSUTRA
const mangalsutraImages = [
  {
    id: 'mangal-1',
    url: '/assets/ZIPMANGALSUTRA/whatsapp-image-2026-05-25-at-5.17.50-pm.jpeg',
    title: 'Dazzling Solitaire Diamond Mangalsutra',
    category: 'MANGALSUTRA',
    weight: '18.2 Grams',
    purity: '18K Gold & Certified Diamonds'
  },
  {
    id: 'mangal-2',
    url: '/assets/ZIPMANGALSUTRA/whatsapp-image-2026-05-25-at-5.17.51-pm.jpeg',
    title: 'Heritage Royal Jadau Mangalsutra',
    category: 'MANGALSUTRA',
    weight: '28.5 Grams',
    purity: '22K Hallmarked Gold'
  },
  {
    id: 'mangal-3',
    url: '/assets/ZIPMANGALSUTRA/whatsapp-image-2026-05-25-at-5.17.52-pm.jpeg',
    title: 'Classic Traditional Gold Mangalsutra',
    category: 'MANGALSUTRA',
    weight: '22.0 Grams',
    purity: '22K Hallmarked Gold'
  }
];

// Rings from ZIPRINGS
const ringImages = [
  {
    id: 'ring-1',
    url: '/assets/ZIPRINGS/whatsapp-image-2026-05-25-at-5.19.39-pm.jpeg',
    title: 'Grand Royal Rajwadi Ring',
    category: 'RINGS',
    weight: '16.5 Grams',
    purity: '22K Gold & Precious Gems'
  },
  {
    id: 'ring-2',
    url: '/assets/ZIPRINGS/whatsapp-image-2026-05-25-at-5.19.40-pm.jpeg',
    title: 'Traditional Polki Jadau Ring',
    category: 'RINGS',
    weight: '14.2 Grams',
    purity: '22K Gold & Polki'
  },
  {
    id: 'ring-3',
    url: '/assets/ZIPRINGS/whatsapp-image-2026-05-25-at-5.19.40-pm-1.jpeg',
    title: 'Luxury Kundan Cocktail Ring',
    category: 'RINGS',
    weight: '18.0 Grams',
    purity: '22K Hallmarked Gold'
  },
  {
    id: 'ring-4',
    url: '/assets/ZIPRINGS/whatsapp-image-2026-05-25-at-5.19.41-pm.jpeg',
    title: 'Dazzling Royal Floral Band',
    category: 'RINGS',
    weight: '11.4 Grams',
    purity: '22K Hallmarked Gold'
  }
];

const allProducts = [...bangleImages, ...earringImages, ...mangalsutraImages, ...ringImages];

const categories = [
  'ALL',
  'BANGLES',
  'EARRINGS',
  'MANGALSUTRA',
  'RINGS'
];


export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [likedProducts, setLikedProducts] = useState({});

  // Live Gold Rates & Admin Panel State
  const [goldRates, setGoldRates] = useState(() => {
    const saved = localStorage.getItem('ND_gold_rates');
    return saved ? JSON.parse(saved) : {
      gold24k: 7650,
      gold22k: 7015,
      gold18k: 5740,
      silver: 92,
      lastUpdated: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }),
      updatedAt: 1716700000000 // default baseline timestamp
    };
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Rate Edit Form States
  const [temp24k, setTemp24k] = useState(goldRates.gold24k);
  const [temp22k, setTemp22k] = useState(goldRates.gold22k);
  const [temp18k, setTemp18k] = useState(goldRates.gold18k);
  const [tempSilver, setTempSilver] = useState(goldRates.silver);

  // Load public rates from Supabase on startup
  useEffect(() => {
    const fetchRates = async () => {
      const { data, error } = await supabase.from('nd_rates').select('*').eq('id', 1).single();
      if (data && !error) {
        setGoldRates(data);
      } else {
        console.error("Error fetching live public rates:", error);
      }
    };
    fetchRates();
  }, []);

  // Auto-advance banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance models slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };


  const toggleLike = (id) => {
    setLikedProducts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const element = document.getElementById('showcase');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoToMainAdmin = () => {
    window.location.href = '/admin';
  };

  // Admin login and update logic
  const handleAdminLogin = (e) => {
    e.preventDefault();
    const envPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'nd@12';
    if (passcode === envPasscode || passcode === 'nd@12') {
      setIsAuthed(true);
      setErrorMsg('');
      setTemp24k(goldRates.gold24k);
      setTemp22k(goldRates.gold22k);
      setTemp18k(goldRates.gold18k);
      setTempSilver(goldRates.silver);
    } else {
      setErrorMsg('Invalid Passcode');
    }
  };

  const handleSaveRates = async (e) => {
    e.preventDefault();
    const now = new Date().toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    const newRates = {
      gold24k: Number(temp24k),
      gold22k: Number(temp22k),
      gold18k: Number(temp18k),
      silver: Number(tempSilver),
      lastUpdated: now
    };

    setGoldRates(newRates);

    try {
      const { error } = await supabase.from('nd_rates').update(newRates).eq('id', 1);
      if (error) {
        console.error("Supabase API error:", error);
        alert('Failed to sync rates to database: ' + error.message);
      } else {
        alert('Live Rates updated instantly in the database!');
      }
    } catch (err) {
      console.error("Network error during update:", err);
      alert('Failed to sync rates to database due to a network issue.');
    }

    setIsAdminOpen(false);
  };

  const handleAdminLogout = () => {
    setIsAuthed(false);
    setPasscode('');
    setErrorMsg('');
  };

  // Filter products based on selected tab
  const filteredProducts = activeCategory === 'ALL' 
    ? allProducts 
    : allProducts.filter(p => p.category === activeCategory);

  return (
    <div className="app-container">
      
      {/* Animated Live Gold Rates Ticker Bar */}
      <div className="gold-ticker-bar">
        <div className="ticker-content-wrapper">
          <div className="ticker-items">
            <span className="ticker-live-dot">
              <span className="ping-dot"></span>
              LIVE RATE
            </span>
            <span className="ticker-item" style={{ fontWeight: 700, color: 'var(--royal-gold)' }}>ND JEWELLERS:</span>
            <span className="ticker-item">24K GOLD: <strong>₹{goldRates.gold24k}/g</strong></span>
            <span className="ticker-item-separator">•</span>
            <span className="ticker-item">22K GOLD: <strong>₹{goldRates.gold22k}/g</strong></span>
            <span className="ticker-item-separator">•</span>
            <span className="ticker-item">18K GOLD: <strong>₹{goldRates.gold18k}/g</strong></span>
            <span className="ticker-item-separator">•</span>
            <span className="ticker-item">SILVER: <strong>₹{goldRates.silver}/g</strong></span>
            <span className="ticker-item-separator">•</span>
            <span className="ticker-item" style={{ color: 'var(--royal-gold)', fontWeight: 500, fontSize: '9px' }}>[UPDATED: {goldRates.lastUpdated}]</span>
            
            {/* Duplicated loop for infinite scrolling marquee */}
            <span className="ticker-item-separator" style={{ margin: '0 20px' }}>★</span>
            <span className="ticker-item">24K GOLD: <strong>₹{goldRates.gold24k}/g</strong></span>
            <span className="ticker-item-separator">•</span>
            <span className="ticker-item">22K GOLD: <strong>₹{goldRates.gold22k}/g</strong></span>
            <span className="ticker-item-separator">•</span>
            <span className="ticker-item">18K GOLD: <strong>₹{goldRates.gold18k}/g</strong></span>
            <span className="ticker-item-separator">•</span>
            <span className="ticker-item">SILVER: <strong>₹{goldRates.silver}/g</strong></span>
            <span className="ticker-item-separator">•</span>
            <span className="ticker-item" style={{ color: 'var(--royal-gold)', fontWeight: 500, fontSize: '9px' }}>[UPDATED: {goldRates.lastUpdated}]</span>
          </div>
        </div>
      </div>
      
      {/* 1. Header & Navigation */}
      <header className="header-main">
        <div className="nav-container">
          
          {/* Logo Brand Title */}
          <a href="#" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/assets/logo.png" 
              alt="ND JEWELLERS Logo" 
              className="brand-logo-img" 
              style={{ width: '67px', height: 'auto', objectFit: 'contain' }}
            />
            <div className="brand-text-container">
              <span className="brand-name">ND JEWELLERS</span>
              <span className="brand-subtitle">KOLKATA</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav">
            <a href="#" className="nav-link">HOME</a>
            <a href="#collage" className="nav-link">OUR STORY</a>
            <a href="#categories" className="nav-link">CATEGORIES</a>
            <a href="#showcase" className="nav-link">COLLECTIONS</a>
            <a href="#models" className="nav-link">OUR MODELS</a>
            <a href="#contact" className="nav-link">CONTACT</a>
          </nav>

          {/* Call button */}
          <a href="tel:+916290679911" className="call-btn">
            <Phone className="icon-sm" />
            <span>CALL NOW</span>
          </a>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="icon-md" /> : <Menu className="icon-md" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="mobile-nav">
            <a href="#" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">HOME</a>
            <a href="#collage" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">OUR STORY</a>
            <a href="#categories" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">CATEGORIES</a>
            <a href="#showcase" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">COLLECTIONS</a>
            <a href="#models" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">OUR MODELS</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">CONTACT</a>
            <a href="tel:+916290679911" className="mobile-call-btn">
              <Phone className="icon-sm" />
              <span>CALL NOW</span>
            </a>
          </div>
        )}
      </header>

      {/* 2. Hero Banner Slider Carousel */}
      <section className="hero-section">
        {bannerImages.map((banner, index) => (
          <div 
            key={index}
            className={`carousel-slide ${index === activeSlide ? 'active' : ''}`}
          >
            
            {/* Embedded Floating Lotus Flowers (Pink Petals & Soft Green Leaves) */}
            <svg className="lotus-floating left" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Green base leaves */}
              <path d="M60 90C45 90 20 80 15 70C25 65 45 75 60 90Z" fill="#3d5a45" opacity="0.8" />
              <path d="M60 90C75 90 100 80 105 70C95 65 75 75 60 90Z" fill="#3d5a45" opacity="0.8" />
              {/* Pink petals layered */}
              <path d="M60 30C52 50 35 65 20 70C40 70 52 78 60 100C68 78 80 70 100 70C85 65 68 50 60 30Z" fill="#e07a93" opacity="0.85" />
              <path d="M60 45C55 60 43 72 30 75C45 75 55 80 60 95C65 80 75 75 90 75C77 72 65 60 60 45Z" fill="#f2a8b9" opacity="0.95" />
              <path d="M60 55C57 68 50 75 42 78C50 78 57 82 60 90C63 82 70 78 78 78C70 75 63 68 60 55Z" fill="#ffffff" opacity="0.9" />
              <circle cx="60" cy="78" r="4" fill="#b8923a" />
            </svg>

            <svg className="lotus-floating right" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Green base leaves */}
              <path d="M60 90C45 90 20 80 15 70C25 65 45 75 60 90Z" fill="#3d5a45" opacity="0.8" />
              <path d="M60 90C75 90 100 80 105 70C95 65 75 75 60 90Z" fill="#3d5a45" opacity="0.8" />
              {/* Pink petals layered */}
              <path d="M60 30C52 50 35 65 20 70C40 70 52 78 60 100C68 78 80 70 100 70C85 65 68 50 60 30Z" fill="#e07a93" opacity="0.85" />
              <path d="M60 45C55 60 43 72 30 75C45 75 55 80 60 95C65 80 75 75 90 75C77 72 65 60 60 45Z" fill="#f2a8b9" opacity="0.95" />
              <path d="M60 55C57 68 50 75 42 78C50 78 57 82 60 90C63 82 70 78 78 78C70 75 63 68 60 55Z" fill="#ffffff" opacity="0.9" />
              <circle cx="60" cy="78" r="4" fill="#b8923a" />
            </svg>

            <div className="carousel-overlay">
              
              {/* Present badges block */}
              <div className="banner-badge-container">
                <span className="banner-brand-tag">{banner.pre}</span>
                <span className="banner-presents-tag">{banner.presents}</span>
              </div>

              {/* Title Word Line layout (A Lifetime OF Love style) */}
              <h1 className="banner-main-title">
                <span className="title-decor-box"><span className="title-decor-text">{banner.line1}</span></span>
                <span className="title-line-word">{banner.line2}</span>
                <span className="title-decor-box"><span className="title-decor-text">{banner.line3}</span></span>
                <span className="title-line-word">{banner.line4}</span>
              </h1>

              {/* Central Oval Arched Frame */}
              <div className="hero-oval-arch-frame">
                <img 
                  src={banner.url} 
                  alt={banner.line2}
                  className="hero-arch-inner-image"
                />
              </div>

              {/* Bottom Trusted info text */}
              <p className="banner-bottom-text">
                {banner.sub}
              </p>

            </div>
          </div>
        ))}

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`indicator-dot ${index === activeSlide ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Carousel Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="carousel-nav-btn prev"
          aria-label="Previous slide"
          style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff', border: '1px solid #c5c2ba' }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }} fill="none" stroke="#b8923a" strokeWidth="1.5">
            <path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" />
            <circle cx="12" cy="12" r="2.5" fill="#b8923a" />
          </svg>
        </button>
        <button 
          onClick={nextSlide}
          className="carousel-nav-btn next"
          aria-label="Next slide"
          style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff', border: '1px solid #c5c2ba' }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }} fill="none" stroke="#b8923a" strokeWidth="1.5">
            <path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" />
            <circle cx="12" cy="12" r="2.5" fill="#b8923a" />
          </svg>
        </button>

        {/* Breathing Scroll Down Indicator */}
        <div className="hero-scroll-indicator">
          <span className="scroll-text">SCROLL DOWN</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* 3. Vintage Collage Showcase Section */}
      <section id="collage" className="collage-section">
        <div className="section-inner">
          <div className="section-header">
            <p className="story-card-text">
              The collection for regal refinement and dignity,<br />
              fit for royalty jewels to be cherished for generations.
            </p>
            <div className="title-divider" />
          </div>

          <div className="collage-grid">
            
            {/* Left Collage Blocks */}
            <div className="collage-left">
              <div>
                <span className="polaroid-label-above">JEWELS TO BE TREASURED FOR GENERATIONS</span>
                {/* Polaroid Photo 1 */}
                <div className="polaroid-frame polaroid-left">
                  <div className="polaroid-image-container">
                    <img 
                      src="/assets/ZIPEARRINGS/earring-3.jpeg" 
                      alt="Heritage Earring Gold Piece"
                      className="polaroid-image"
                    />
                  </div>
                  <div className="polaroid-caption">
                    <span className="caption-main">THE ROYAL JADAU HARAM</span>
                    <span className="caption-sub">ND JEWELLERS Heritage</span>
                  </div>
                </div>
              </div>

              {/* Polaroid Photo 2 (Model wearing Red Sari) */}
              <div className="polaroid-frame polaroid-right">
                <div className="polaroid-image-container aspect-[3/4]">
                  <img 
                    src="/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.46-pm.jpeg" 
                    alt="Bridal Heritage Gold Necklace Model"
                    className="polaroid-image"
                  />
                </div>
                <div className="polaroid-caption">
                  <span className="caption-main">ROYAL BRIDAL ESSENCE</span>
                  <span className="caption-sub">Traditional Jammu Jhumkis</span>
                </div>
              </div>
            </div>

            {/* Middle Collage / Model Circle */}
            <div className="collage-middle">
              <div className="circle-frame-wrapper">
                <div className="ring-glow" />
                <div className="circle-image-container">
                  <img 
                    src="/assets/ZIPMODELS/whatsapp-image-2026-05-25-at-4.50.46-pm-1.jpeg" 
                    alt="Royal Traditional Model"
                    className="circle-image"
                  />
                </div>
                
                {/* Small overlay Badge */}
                <div className="royal-badge">
                  <Award className="icon-sm text-gold" />
                  <span className="badge-year">SINCE 1988</span>
                  <span className="badge-title">ROYAL TRADITION</span>
                </div>
              </div>
            </div>

            {/* Right Collage Blocks */}
            <div className="collage-right">
              {/* Polaroid Photo 3 */}
              <div className="polaroid-frame polaroid-left">
                <div className="polaroid-image-container">
                  <img 
                    src="/assets/ZIPRINGS/whatsapp-image-2026-05-25-at-5.19.39-pm.jpeg" 
                    alt="Heritage Statement Ring"
                    className="polaroid-image"
                  />
                </div>
                <div className="polaroid-caption">
                  <span className="caption-main">RAJWADI STATEMENT RING</span>
                  <span className="caption-sub">Handcarved Gold Heritage</span>
                </div>
              </div>

              {/* Circular Earrings Frame with Watermark badge */}
              <div className="circle-frame-wrapper" style={{ alignSelf: 'center', marginTop: '10px' }}>
                <div className="circle-image-container" style={{ width: '180px', height: '180px', borderStyle: 'dashed' }}>
                  <img 
                    src="/assets/ZIPEARRINGS/earring-1.jpeg" 
                    alt="Earring highlight"
                    className="circle-image"
                  />
                </div>
                <div className="badge-card" style={{ marginTop: '15px', borderRadius: '8px' }}>
                  <div className="badge-card-header">
                    <ShieldCheck className="icon-sm text-gold" />
                    <span className="badge-card-title">100% HALLMARKED</span>
                  </div>
                  <p className="badge-card-text">
                    Pure BIS 22K Hallmarked Gold.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3.5. Digital Gold Harvest Scheme Advertisement */}
      <section className="harvest-promo-section" style={{ background: 'var(--royal-gold)', color: '#fff', padding: '60px 20px', textAlign: 'center', margin: '40px 0', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '15px', fontFamily: '"Playfair Display", serif', textTransform: 'uppercase', letterSpacing: '2px' }}>Join our Digital Gold Harvest Scheme</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', maxWidth: '700px', margin: '0 auto 30px', opacity: '0.9', lineHeight: '1.6' }}>
          Invest simply for 11 months, and get the 12th month absolutely free as a BONUS! Secure your future with pure BIS Hallmarked Gold and certified diamonds.
        </p>
        <Link to="/dashboard" style={{ display: 'inline-block', background: '#fff', color: 'var(--royal-gold)', padding: '16px 32px', fontWeight: 'bold', fontSize: '1.1rem', textDecoration: 'none', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          Start Your Scheme Today
        </Link>
      </section>

      {/* 4. Shop By Category */}
      <section id="categories" className="categories-section">
        <div className="section-inner">
          
          <div className="section-header">
            <h2 className="section-pretitle">SHOP BY CATEGORY</h2>
            <h3 className="section-title">The collection everyone is talking about</h3>
            <div className="title-divider" />
          </div>

          <div className="categories-marquee-container">
            <div className="categories-marquee-row">
              {[1, 2, 3, 4].map((multiplier) => (
                <React.Fragment key={multiplier}>
                  {/* Category 1: BANGLES */}
                  <div className="category-card" onClick={() => handleCategoryClick('BANGLES')}>
                    <div className="category-image-wrapper">
                      <img 
                        src={bangleImages[1].url} 
                        alt="Bangles & Kadas"
                        className="category-image"
                      />
                    </div>
                    <h4 className="category-card-title">BANGLES & KADAS</h4>
                  </div>

                  {/* Category 2: EARRINGS */}
                  <div className="category-card" onClick={() => handleCategoryClick('EARRINGS')}>
                    <div className="category-image-wrapper">
                      <img 
                        src={earringImages[0].url} 
                        alt="Earrings Collection"
                        className="category-image"
                      />
                    </div>
                    <h4 className="category-card-title">EARRINGS</h4>
                  </div>

                  {/* Category 3: MANGALSUTRA */}
                  <div className="category-card" onClick={() => handleCategoryClick('MANGALSUTRA')}>
                    <div className="category-image-wrapper">
                      <img 
                        src={mangalsutraImages[0].url} 
                        alt="Mangalsutra Collection"
                        className="category-image"
                      />
                    </div>
                    <h4 className="category-card-title">MANGALSUTRA</h4>
                  </div>

                  {/* Category 4: RINGS */}
                  <div className="category-card" onClick={() => handleCategoryClick('RINGS')}>
                    <div className="category-image-wrapper">
                      <img 
                        src={ringImages[0].url} 
                        alt="Statement Rings Collection"
                        className="category-image"
                      />
                    </div>
                    <h4 className="category-card-title">STATEMENT RINGS</h4>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Jewelry Showcase & Category Filters */}
      <section id="showcase" className="showcase-section">
        <div className="section-inner">
          
          <div className="section-header">
            <h2 className="section-pretitle">SHOP BY COLLECTION</h2>
            <h3 className="section-title">Explore our diverse selections</h3>
            <p className="section-header-sub">BIS Hallmarked • Custom Handcrafted Designs</p>
            <div className="title-divider" />
          </div>

          {/* Interactive Filter Buttons (Image 3 Style) */}
          <div className="filter-container">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`filter-tab-btn ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid Showcase */}
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="product-card"
              >
                {/* Product Image Frame */}
                <div className="product-image-outer">
                  <div className="product-image-inner">
                    <img 
                      src={product.url} 
                      alt={product.title}
                      className="product-image"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="product-card-hover-overlay">
                      <button 
                        onClick={() => toggleLike(product.id)}
                        className={`wishlist-btn ${likedProducts[product.id] ? 'liked' : ''}`}
                        aria-label="Add to wishlist"
                      >
                        <Heart className="icon-sm" />
                      </button>
                      <a 
                        href={`https://wa.me/916290679911?text=Hello%20HARDIK%20Jewellers,%20I%20am%20interested%20in%20buying%20your%20${encodeURIComponent(product.title)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp-inquire-btn"
                      >
                        INQUIRE ON WHATSAPP
                      </a>
                    </div>
                  </div>
                </div>

                {/* Info Area */}
                <div className="product-card-info">
                  <div>
                    <span className="product-card-category">{product.category}</span>
                    <h4 className="product-card-title-text">
                      {product.title}
                    </h4>
                  </div>
                  
                  <div className="product-card-specs">
                    <div className="spec-item">
                      <span className="spec-label">Purity</span>
                      <span className="spec-val">{product.purity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="custom-order-box">
              <span className="custom-order-title">CUSTOM ORDER ONLY</span>
              <p className="custom-order-desc">
                We craft bespoke handcrafted pieces matching your specifications for {activeCategory}. Please contact our KOLKATA showroom on WhatsApp to design your dream piece.
              </p>
              <a 
                href="https://wa.me/916290679911?text=Hello%20HARDIK%20Jewellers,%20I%20want%20to%20place%20a%20custom%20order." 
                target="_blank"
                rel="noreferrer"
                className="custom-order-link"
              >
                TALK TO DESIGNER &rarr;
              </a>
            </div>
          )}

        </div>
      </section>

      {/* 6. Our Models Gallery Horizontal Marquee Strip */}
      <section id="models" className="models-marquee-section">
        <div className="section-inner" style={{ maxWidth: '100%', padding: '0 0' }}>
          
          <div className="section-header">
            <h3 className="section-title">OUR MODELS</h3>
            <div className="title-divider" />
          </div>

          <div className="models-marquee-container">
            <div className="models-marquee-row">
              {/* Duplicate the models list twice for a seamless infinite loop */}
              {[...modelImages, ...modelImages].map((model, index) => (
                <div key={index} className="model-marquee-card">
                  <img 
                    src={model.url} 
                    alt={model.title} 
                    className="model-marquee-img" 
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 7. Showroom Location & Contact */}
      <section id="contact" className="contact-section">
        <div className="section-inner">
          <div className="contact-grid">
            
            {/* Showroom info & Details */}
            <div className="contact-info-block">
              <h2 className="section-pretitle">VISIT OUR SHOWROOM</h2>
              <h3 className="showroom-title">ND JEWELLERS</h3>
              <p className="showroom-desc">
                Step into a world of pure heritage gold and flawless diamonds. Our flagship showroom in KOLKATA showcases one-of-a-kind bespoke bridal sets, beautiful light-weight items, and custom kada collections.
              </p>

              <div className="info-cards-stack">
                
                {/* Location */}
                <div className="info-card-item">
                  <div className="info-card-icon-wrapper">
                    <MapPin className="icon-md" />
                  </div>
                  <div className="info-card-text">
                    <h4 className="info-card-label">Our Showroom Address</h4>
                    <p className="info-card-value">
                      Shop no 416, Triveni building, Opposite Harmam Mohta Gate Shiv Road, KOLKATA 1, Birla Gate, Kalyan, Maharashtra 421103
                    </p>
                    <a href="https://www.google.com/maps/place/ND+jewellers,+441,+Rabindra+Sarani,+Sovabazar,+Beniatola,+Kolkata,+West+Bengal+700005/@22.5962929,88.3618238,15z/data=!4m6!3m5!1s0x3a0277ccdc190a85:0xdf54e9cc5c35d3af!8m2!3d22.5962929!4d88.3618238!16s%2Fg%2F11f5bh5rmf?g_ep=Eg1tbF8yMDI2MDYwMl8wIOC7DCoASAJQAg%3D%3D" target="_blank" rel="noreferrer" className="whatsapp-link" style={{ marginTop: '4px', fontSize: '11px', display: 'inline-block' }}>
                      VIEW ON GOOGLE MAPS &rarr;
                    </a>
                  </div>
                </div>

                {/* Timing */}
                <div className="info-card-item">
                  <div className="info-card-icon-wrapper">
                    <Clock className="icon-md" />
                  </div>
                  <div className="info-card-text">
                    <h4 className="info-card-label">Showroom Timings</h4>
                    <p className="info-card-value">
                      Mon - Sat: 10:30 AM to 08:00 PM <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="info-card-item">
                  <div className="info-card-icon-wrapper">
                    <Phone className="icon-md" />
                  </div>
                  <div className="info-card-text">
                    <h4 className="info-card-label">Phone & Inquiries</h4>
                    <a href="tel:+916290679911" className="info-card-phone-link">
                      +91 62906 79911
                    </a>
                    <a href="https://wa.me/916290679911?text=Hello%20HARDIK%20Jewellers,%20I%20have%20an%20inquiry%20regarding%20your%20collections." className="whatsapp-link" target="_blank" rel="noreferrer">
                      CONNECT ON WHATSAPP &rarr;
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="contact-form-block">
              <h4 className="form-card-title">Book an Appointment</h4>
              <p className="form-card-subtitle">
                Fill the form below to receive a personalized bridal collection catalog or schedule a virtual preview call.
              </p>
              
              <form onSubmit={(e) => { e.preventDefault(); alert("Thank you! Our KOLKATA showroom representative will reach out to you shortly."); }} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="input-label">Your Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input"
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Your Mobile Number</label>
                    <input 
                      type="tel" 
                      required
                      className="form-input"
                      placeholder="e.g. +91 99999 99999"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Interested Category</label>
                  <select 
                    className="form-select"
                  >
                    <option>Heritage Bangles & Kadas</option>
                    <option>Bridal Choker Necklaces</option>
                    <option>Heritage Jhumki & Earrings</option>
                    <option>Statement Rings</option>
                    <option>Custom Handcrafted Polki</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">Additional Message</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="Describe your design preference, weight, and requirements..."
                  />
                </div>

                <button 
                  type="submit" 
                  className="form-submit-btn"
                >
                  SUBMIT INQUIRY
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="footer-main">
        <div className="footer-inner">
          <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/assets/logo.png" 
              alt="ND JEWELLERS Logo" 
              style={{ width: '112px', height: 'auto', objectFit: 'contain' }}
            />
            <span className="footer-brand-title">ND JEWELLERS</span>
            <span className="footer-brand-sub">KOLKATA</span>
          </div>

          <div className="footer-links">
            <a href="#" className="footer-link-item">PRIVACY POLICY</a>
            <span className="footer-separator">•</span>
            <a href="#" className="footer-link-item">TERMS OF USE</a>
            <span className="footer-separator">•</span>
            <a href="#" className="footer-link-item">BIS HALLMARKING POLICY</a>
            <span className="footer-separator">•</span>
            <button onClick={() => { setIsAdminOpen(true); handleAdminLogout(); }} className="footer-link-item" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0, color: 'var(--royal-gold)', fontWeight: 'bold' }}>ADMIN PANEL</button>
          </div>

          <div className="footer-socials">
            <span className="social-label">FOLLOW US ON INSTAGRAM:</span>
            <a href="https://www.instagram.com/nd_jewellers000?igsh=MXBrdG0xNG9mZGNvOQ==" target="_blank" rel="noreferrer" className="instagram-circle-btn" aria-label="Instagram">
              <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>
        
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} ND JEWELLERS. All Rights Reserved. Pure BIS Hallmarked Gold & Certified Diamonds.
        </div>
      </footer>

      {/* 9. Admin Panel Modal Overlay */}
      {isAdminOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <button 
              className="admin-modal-close" 
              onClick={() => setIsAdminOpen(false)}
              aria-label="Close Admin Panel"
            >
              <X className="icon-md" />
            </button>

            {!isAuthed ? (
              /* Passcode Screen */
              <form onSubmit={handleAdminLogin}>
                <h3 className="admin-form-title">ADMIN SECURITY LOGIN</h3>
                <div className="admin-form-group">
                  <label className="admin-form-label">Enter Passcode</label>
                  <input 
                    type="password" 
                    required 
                    className="admin-form-input" 
                    placeholder="Enter admin passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                  />
                  {errorMsg && <p className="admin-error-msg">{errorMsg}</p>}
                </div>
                <button type="submit" className="admin-submit-btn">ACCESS PANEL</button>
              </form>
            ) : (
              /* Live Rates Dashboard Screen */
              <form onSubmit={handleSaveRates}>
                <h3 className="admin-form-title">LIVE RATES DASHBOARD</h3>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">24K Gold Rate (₹ per gram)</label>
                  <input 
                    type="number" 
                    required 
                    className="admin-form-input" 
                    value={temp24k}
                    onChange={(e) => setTemp24k(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">22K Gold Rate (₹ per gram)</label>
                  <input 
                    type="number" 
                    required 
                    className="admin-form-input" 
                    value={temp22k}
                    onChange={(e) => setTemp22k(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">18K Gold Rate (₹ per gram)</label>
                  <input 
                    type="number" 
                    required 
                    className="admin-form-input" 
                    value={temp18k}
                    onChange={(e) => setTemp18k(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Silver Rate (₹ per gram)</label>
                  <input 
                    type="number" 
                    required 
                    className="admin-form-input" 
                    value={tempSilver}
                    onChange={(e) => setTempSilver(e.target.value)}
                  />
                </div>

                <button type="submit" className="admin-submit-btn">PUBLISH LIVE RATES PUBLICLY</button>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center', lineHeight: '1.4' }}>
                  <strong>Note:</strong> Submitting this form will automatically write and push the updated rates directly to your GitHub repository! Vercel will automatically re-deploy the new rates publicly for all visitors within 20 seconds.
                </p>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed var(--royal-gold)', textAlign: 'center' }}>
                  <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '14px', letterSpacing: '2px' }}>HARVEST SCHEME SETTINGS</h4>
                  <button 
                    type="button" 
                    onClick={() => window.location.href = '/admin'} 
                    className="admin-submit-btn"
                    style={{ background: 'var(--royal-gold)', color: 'var(--rich-black)', fontWeight: 'bold' }}
                  >
                    OPEN HARVEST ADMIN PANEL
                  </button>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    (Verify payments, Add manual payments, Upload QR Code)
                  </p>
                </div>

                <button 
                  type="button" 
                  onClick={handleAdminLogout} 
                  className="admin-submit-btn"
                  style={{ background: 'transparent', border: '1px solid var(--royal-gold)', color: 'var(--royal-gold)', marginTop: '24px' }}
                >
                  LOG OUT
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
