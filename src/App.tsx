import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, Plus, Minus, Clock, MapPin, Phone, Mail, ArrowRight, Heart, Star } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: number
  name: string
  category: "Breads" | "Pastries" | "Savories" | "Mercantile"
  price: number
  desc: string
  unit?: string
  popular?: boolean
}

interface CartLine {
  item: MenuItem
  qty: number
}

interface GalleryImage {
  src: string
  alt: string
  caption: string
}

const menuItems: MenuItem[] = [
  { id: 1, name: "Classic Sourdough", category: "Breads", price: 8.5, desc: "36-hour fermented loaf, crackling crust, tangy open crumb. Our daily foundation.", popular: true },
  { id: 2, name: "Seeded Whole Wheat", category: "Breads", price: 9, desc: "Nutty, hearty, loaded with flax, sesame, sunflower and pumpkin seeds.", unit: "loaf" },
  { id: 3, name: "Rosemary Olive Loaf", category: "Breads", price: 9.5, desc: "Fragrant rosemary and briny kalamata olives baked into a golden crust." },
  { id: 4, name: "Butter Croissant", category: "Pastries", price: 4.25, desc: "Laminated daily with European butter. Flaky, golden, perfect with coffee.", popular: true },
  { id: 5, name: "Almond Croissant", category: "Pastries", price: 5.5, desc: "Filled with almond frangipane, finished with toasted almonds and powdered sugar." },
  { id: 6, name: "Cinnamon Morning Bun", category: "Pastries", price: 4.75, desc: "Swirled with cinnamon sugar and orange zest, baked until caramelized edges." },
  { id: 7, name: "Pain au Chocolat", category: "Pastries", price: 4.75, desc: "Two batons of dark chocolate wrapped in layers of buttery pastry." },
  { id: 8, name: "Ham & Gruyère Hand Pie", category: "Savories", price: 7.5, desc: "Flaky pastry pocket filled with smoked ham, aged gruyère and a touch of mustard.", popular: true },
  { id: 9, name: "Tomato & Basil Quiche", category: "Savories", price: 6.75, desc: "Individual slice. Slow-roasted tomatoes, fresh basil, farm egg custard in butter crust." },
  { id: 10, name: "Spinach Feta Pocket", category: "Savories", price: 7, desc: "Wild spinach, local feta, dill and lemon zest in a whole wheat crust." },
  { id: 11, name: "Strawberry Rhubarb Jam", category: "Mercantile", price: 9, desc: "Small batch, 9oz jar. Made with local berries and just enough sugar.", unit: "jar" },
  { id: 12, name: "Wildflower Honey", category: "Mercantile", price: 11, desc: "Raw, unfiltered. From hives 12 miles up the canyon. 12oz jar.", unit: "jar", popular: true },
  { id: 13, name: "Willow Creek Coffee Beans", category: "Mercantile", price: 16, desc: "1 lb bag. Medium roast from our friends at Highline Roasters. Notes of cocoa and stone fruit.", unit: "bag" },
  { id: 14, name: "Linen Apron - Natural", category: "Mercantile", price: 28, desc: "Heavyweight European linen, cross-back style. One size fits most. Built to last generations." },
]

const categories = ["All", "Breads", "Pastries", "Savories", "Mercantile"] as const

const gallery: GalleryImage[] = [
  { src: "/images/bread.jpg", alt: "Freshly baked sourdough loaves on a flour-dusted table", caption: "Our daily sourdough cooling on the rack" },
  { src: "/images/display.jpg", alt: "Bakery display case filled with croissants, danishes and morning buns", caption: "The pastry case at opening" },
  { src: "/images/interior.jpg", alt: "Warm interior of the restored depot with wooden beams and mercantile shelves", caption: "Inside the 1898 station house" },
  { src: "/images/savory.jpg", alt: "Selection of savory hand pies and quiches on a wooden board", caption: "Savory bakes for lunch or picnic" },
  { src: "/images/merc.jpg", alt: "Mercantile shelves stocked with jars of jam, honey, coffee and pottery", caption: "The mercantile corner" },
  { src: "/images/baker.jpg", alt: "Artisan baker placing a fresh loaf on a cooling rack", caption: "Fresh from the oven" },
]

const navLinks = [
  { label: "Our Story", href: "#about" },
  { label: "Menu", href: "#menu" },
  { label: "The Mercantile", href: "#mercantile" },
  { label: "Visit", href: "#visit" },
]

function App() {
  // UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [menuFilter, setMenuFilter] = useState<typeof categories[number]>("All")
  
  // Cart
  const [cart, setCart] = useState<CartLine[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  // Gallery lightbox
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  
  // Contact form
  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0)
  const cartTotal = cart.reduce((sum, line) => sum + line.item.price * line.qty, 0)

  // Filtered menu
  const filteredMenu = menuFilter === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === menuFilter)

  // Active section observer for nav highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            if (id === "about" || id === "menu" || id === "mercantile" || id === "visit") {
              setActiveSection(id)
            } else if (entry.target.tagName === "HEADER" || id === "hero") {
              setActiveSection("home")
            }
          }
        })
      },
      { rootMargin: "-80px 0px -40% 0px", threshold: 0.3 }
    )

    const sections = document.querySelectorAll("section[id], header")
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Cart helpers
  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.findIndex((line) => line.item.id === item.id)
      if (existing !== -1) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 }
        return updated
      }
      return [...prev, { item, qty: 1 }]
    })
    toast.success("Added " + item.name, {
      description: "$" + item.price.toFixed(2) + " • Pickup at the depot",
      action: {
        label: "View basket",
        onClick: () => setIsCartOpen(true),
      },
    })
  }

  function updateCartQty(id: number, newQty: number) {
    if (newQty < 1) return
    setCart((prev) =>
      prev.map((line) =>
        line.item.id === id ? { ...line, qty: newQty } : line
      )
    )
  }

  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((line) => line.item.id !== id))
  }

  function clearCart() {
    setCart([])
  }

  function openCart() {
    setIsCartOpen(true)
    setIsMobileMenuOpen(false)
  }

  function closeCart() {
    setIsCartOpen(false)
  }

  // Fake checkout
  function handleCheckout() {
    if (cart.length === 0) return
    
    const itemCount = cart.reduce((s, l) => s + l.qty, 0)
    toast.success("Order placed for pickup!", {
      description: itemCount + " items • Ready in about 30 minutes. See you at the depot.",
    })
    
    setTimeout(() => {
      clearCart()
      closeCart()
    }, 800)
  }

  // Gallery
  function openGallery(index: number) {
    setSelectedImageIndex(index)
    document.body.style.overflow = "hidden"
  }
  
  function closeGallery() {
    setSelectedImageIndex(null)
    document.body.style.overflow = ""
  }
  
  function goToGallery(delta: number) {
    if (selectedImageIndex === null) return
    const next = (selectedImageIndex + delta + gallery.length) % gallery.length
    setSelectedImageIndex(next)
  }

  // Contact form (fake)
  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill out all fields")
      return
    }
    
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 650))
    setIsSubmitting(false)
    setFormSuccess(true)
    toast.success("Thank you!", { description: "We have received your note and will reply within a day." })
    
    setTimeout(() => {
      setFormData({ name: "", email: "", message: "" })
      setFormSuccess(false)
    }, 1800)
  }

  // Scroll helper
  function scrollToSection(href: string) {
    const id = href.replace("#", "")
    const el = document.getElementById(id)
    if (el) {
      const offset = 70
      const bodyRect = document.body.getBoundingClientRect().top
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition - bodyRect - offset
      window.scrollTo({ top: offsetPosition, behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  const selectedGalleryImage = selectedImageIndex !== null ? gallery[selectedImageIndex] : null

  return (
    <div className="min-h-screen bg-cream text-brown font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-flour">
        <nav className="max-w-6xl mx-auto px-5 flex items-center justify-between h-20" aria-label="Main navigation">
          <a href="#hero" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }) }} className="flex flex-col leading-none group" aria-label="The Last Stop Bakery & Mercantile home">
            <span className="font-serif text-2xl tracking-[-0.5px] text-deep-brown group-hover:text-terracotta transition-colors">The Last Stop</span>
            <span className="text-[10px] uppercase tracking-[2px] text-terracotta -mt-0.5">Bakery &amp; Mercantile</span>
          </a>

          <div className="hidden md:flex items-center gap-9 text-sm">
            {navLinks.map((link) => {
              const sectionId = link.href.slice(1)
              const isActive = activeSection === sectionId
              return (
                <a key={link.href} href={link.href} onClick={(e) => { e.preventDefault(); scrollToSection(link.href) }} className={`nav-link text-sm font-medium ${isActive ? "active" : ""}`}>
                  {link.label}
                </a>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={openCart} className="relative flex items-center gap-2 px-4 py-2 rounded-md hover:bg-flour/60 transition-colors focus-visible:ring-2 focus-visible:ring-brown" aria-label={`Open shopping basket (${cartCount} items)`}>
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Basket</span>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-terracotta text-cream text-[10px] font-mono min-w-[17px] h-[17px] rounded-full flex items-center justify-center px-1">{cartCount}</span>}
            </button>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-md hover:bg-flour/60" aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-flour bg-cream">
              <div className="px-5 py-6 flex flex-col gap-4 text-base">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} onClick={(e) => { e.preventDefault(); scrollToSection(link.href) }} className="py-1 text-brown/90 hover:text-brown">{link.label}</a>
                ))}
                <button onClick={openCart} className="mt-2 btn btn-secondary w-full justify-center"><ShoppingBag className="w-4 h-4 mr-2" /> View Basket {cartCount > 0 && `(${cartCount})`}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO */}
      <section id="hero" className="relative h-[100dvh] min-h-[620px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-deep-brown/60 z-10" />
        <img src="/images/hero.jpg" alt="Historic wooden train depot housing The Last Stop Bakery & Mercantile at golden hour, with mountains in the distance" className="absolute inset-0 w-full h-full object-cover" />
        
        <div className="relative z-20 text-center px-5 max-w-4xl">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-cream/90 text-brown text-xs tracking-[1.5px] uppercase">
            <span>Est. 2017</span><span className="w-px h-3 bg-brown/40" /><span>Willow Creek, Colorado</span>
          </div>
          
          <h1 className="hero-title font-serif text-6xl md:text-7xl text-cream tracking-[-1.5px] leading-[0.95] mb-4">The last stop<br />before the mountains.</h1>
          <p className="max-w-md mx-auto text-lg text-cream/90 mb-9">Fresh bread, honest pastries, and a thoughtfully curated mercantile<br className="hidden md:block" /> at the end of the old Cascade line.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollToSection("#menu")} className="btn btn-primary text-base px-8 group">See the Menu <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition" /></button>
            <button onClick={() => scrollToSection("#visit")} className="btn btn-secondary text-base px-8 border-cream text-cream hover:bg-cream hover:text-deep-brown">Plan Your Visit</button>
          </div>
          <div className="mt-10 text-[11px] uppercase tracking-widest text-cream/70">Open Wed–Sun • Fresh bread from 7am</div>
        </div>

        <button onClick={() => scrollToSection("#about")} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-cream/70 hover:text-cream text-xs tracking-widest" aria-label="Scroll to our story">
          OUR STORY <ArrowRight className="rotate-90 mt-1" size={14} />
        </button>
      </section>

      <main>
        {/* ABOUT */}
        <section id="about" className="max-w-5xl mx-auto px-5 pt-20 pb-16">
          <div className="grid md:grid-cols-12 gap-x-10 gap-y-10 items-center">
            <div className="md:col-span-7">
              <div className="uppercase text-xs tracking-[2px] text-terracotta mb-3">A restored 1898 depot</div>
              <h2 className="font-serif text-5xl leading-[0.95] tracking-[-1px] text-deep-brown mb-6">Baked at the end<br />of the line.</h2>
              <div className="prose prose-brown max-w-prose text-[15px] leading-relaxed space-y-5 text-brown/90">
                <p>Elias Thorne spent twenty-two years riding the rails as a conductor on the Cascade Line. When the last regular passenger service ended, he and his wife Clara bought the abandoned Willow Creek depot.</p>
                <p>Clara, a pastry chef who had long dreamed of a place of her own, turned the station house into a bakery. The old freight room became the mercantile — a place for neighbors to find good bread, local honey, linen, pottery, and the kinds of useful things that used to travel by train.</p>
                <p>We still bake before dawn. The whistle no longer blows, but the lights are on, the coffee is hot, and the bread is always fresh.</p>
              </div>
              <div className="mt-8 flex items-center gap-3 text-sm"><div className="flex -space-x-1"><div className="w-6 h-6 bg-gold rounded-full ring-2 ring-cream" /><div className="w-6 h-6 bg-terracotta rounded-full ring-2 ring-cream" /></div><span className="text-brown/70">Family run • 40+ loaves daily • No preservatives</span></div>
            </div>
            <div className="md:col-span-5"><div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3]"><img src="/images/baker.jpg" alt="Baker placing fresh bread on cooling racks inside the bakery" className="absolute inset-0 w-full h-full object-cover" /></div></div>
          </div>
        </section>

        {/* MENU */}
        <section id="menu" className="bg-warm-white border-y border-flour py-16">
          <div className="max-w-6xl mx-auto px-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div><div className="uppercase tracking-[2px] text-xs text-terracotta mb-1">Every day from the oven</div><h2 className="font-serif text-5xl tracking-[-1.2px] text-deep-brown">The Menu</h2></div>
              <p className="max-w-xs text-brown/70 text-sm md:text-right">All items baked on site. Menu changes with the seasons and what the train brings us.</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter menu by category">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setMenuFilter(cat)} className={`px-5 py-1.5 text-sm rounded-full border transition-all ${menuFilter === cat ? "bg-brown text-cream border-brown" : "border-flour hover:border-gold/60 bg-white"}`} role="tab" aria-selected={menuFilter === cat}>{cat}</button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map((item) => (
                <div key={item.id} className="menu-item group flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-medium text-lg leading-tight pr-2">{item.name}</h3>
                      {item.popular && <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold mt-1"><Star size={11} /> Popular</span>}
                    </div>
                    <p className="text-sm text-brown/75 leading-snug mb-3">{item.desc}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-flour mt-auto">
                    <div><span className="font-mono text-lg tabular-nums">${item.price.toFixed(2)}</span>{item.unit && <span className="text-xs text-brown/60 ml-1">/ {item.unit}</span>}</div>
                    <button onClick={() => addToCart(item)} className="btn btn-gold text-sm py-2 px-5 active:scale-[0.985]" aria-label={`Add ${item.name} to basket`}>Add to basket</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-brown/60 mt-8">Everything is available for same-day pickup. We do not ship.</p>
          </div>
        </section>

        {/* THE MERCANTILE */}
        <section id="mercantile" className="max-w-6xl mx-auto px-5 py-20">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div className="order-2 md:order-1">
              <div className="uppercase text-xs tracking-[2px] text-terracotta mb-3">Not just the bread</div>
              <h2 className="font-serif text-5xl tracking-[-1px] leading-none text-deep-brown mb-5">The Mercantile</h2>
              <div className="text-brown/80 space-y-4 text-[15px] max-w-prose">
                <p>When the railroad was running, the depot was the place you came for supplies you could not grow or make yourself. We keep that spirit alive.</p>
                <p>Our shelves hold small-batch preserves from the valley, raw honey from local beekeepers, coffee roasted up-canyon, and useful goods made by neighbors: linen, pottery, candles, and books worth reading by the fire.</p>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-3 text-sm">
                {menuItems.filter(i => i.category === "Mercantile").slice(0, 4).map(item => (
                  <div key={item.id} className="flex justify-between items-baseline border-b border-flour pb-2">
                    <div><span>{item.name}</span>{item.unit && <span className="text-brown/60 text-xs ml-1">({item.unit})</span>}</div>
                    <div className="font-mono tabular-nums text-right">${item.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => { setMenuFilter("Mercantile"); scrollToSection("#menu") }} className="mt-6 inline-flex items-center text-sm font-medium text-terracotta hover:text-brown group">See full mercantile selection in the menu <ArrowRight className="ml-1.5 group-hover:translate-x-0.5 transition" size={15} /></button>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="rounded-2xl overflow-hidden shadow aspect-[4/3.05] bg-flour">
                <img src="/images/merc.jpg" alt="Wooden mercantile shelves with jars of jam, honey, bags of coffee, pottery and folded linens in warm light" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-3 -left-3 bg-cream px-5 py-2.5 rounded-xl shadow border border-flour text-xs tracking-wide hidden sm:block">Curated goods - Open during bakery hours</div>
            </div>
          </div>
        </section>

        {/* GALLERY */}
        <section className="bg-deep-brown py-16 text-cream">
          <div className="max-w-6xl mx-auto px-5">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="uppercase tracking-[2px] text-xs text-gold/70 mb-1">Moments from the depot</div>
                <h2 className="font-serif text-5xl tracking-[-1px]">From the oven &amp; the shelves</h2>
              </div>
              <button onClick={() => openGallery(0)} className="hidden md:flex items-center text-sm text-gold hover:text-cream">View all photos <ArrowRight className="ml-1.5" size={16} /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((img, idx) => (
                <button key={idx} onClick={() => openGallery(idx)} className="group relative aspect-[4/3] overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold" aria-label={`Open photo: ${img.caption}`}>
                  <img src={img.src} alt={img.alt} className="gallery-img" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-left"><span className="text-xs tracking-wider text-cream/90 line-clamp-1">{img.caption}</span></div>
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 group-hover:ring-gold/40 transition" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* VISIT */}
        <section id="visit" className="max-w-5xl mx-auto px-5 py-20">
          <div className="grid md:grid-cols-5 gap-x-12 gap-y-12">
            <div className="md:col-span-2">
              <div className="uppercase text-xs tracking-[2px] text-terracotta mb-2">Come sit awhile</div>
              <h2 className="font-serif text-[42px] leading-none tracking-[-1.1px] text-deep-brown mb-6">Visit us</h2>
              <div className="space-y-6 text-sm">
                <div className="flex gap-4"><MapPin className="mt-0.5 shrink-0 text-terracotta" size={19} /><div><div className="font-medium">42 Depot Lane</div><div className="text-brown/70">Willow Creek, Colorado 80424</div><a href="https://maps.google.com/?q=42+Depot+Lane+Willow+Creek+CO" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline inline-flex items-center gap-1 mt-1 text-xs">Get directions <ArrowRight size={13} /></a></div></div>
                <div className="flex gap-4"><Phone className="mt-0.5 shrink-0 text-terracotta" size={19} /><div><a href="tel:+19705550192" className="hover:underline">(970) 555-0192</a></div></div>
                <div className="flex gap-4"><Mail className="mt-0.5 shrink-0 text-terracotta" size={19} /><div><a href="mailto:hello@laststopbakery.co" className="hover:underline">hello@laststopbakery.co</a></div></div>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center gap-3 mb-4 text-terracotta"><Clock size={18} /><span className="uppercase tracking-[1.5px] text-xs font-medium">Hours</span></div>
              <div className="hours-table text-[15px] bg-white border border-flour rounded-xl p-6 md:p-8 grid sm:grid-cols-2 gap-x-10">
                <div><div className="font-medium mb-1 text-deep-brown">Wednesday - Sunday</div><div className="font-mono tabular-nums">7:00 AM - 4:00 PM</div><div className="text-xs text-brown/60 mt-1">Last pastries pulled at 3:30</div></div>
                <div className="mt-6 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-t-0 sm:border-l border-flour sm:pl-10"><div className="font-medium mb-1 text-deep-brown">Monday &amp; Tuesday</div><div className="text-brown/70">Closed</div><div className="text-xs text-brown/60 mt-2 leading-snug">Baking &amp; restocking days.<br />Wholesale orders can still be arranged.</div></div>
              </div>
              <p className="mt-4 text-xs max-w-prose text-brown/70">We are a small crew. If you are driving the pass and want something specific, call ahead and we will set it aside.</p>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="border-t border-flour bg-warm-white py-16">
          <div className="max-w-3xl mx-auto px-5 text-center">
            <h2 className="font-serif text-4xl tracking-tight mb-3">Save us a seat at your table.</h2>
            <p className="text-brown/70 max-w-sm mx-auto">Questions, special orders, or just want to say hello? We read every note.</p>

            <form onSubmit={handleFormSubmit} className="mt-9 max-w-md mx-auto text-left space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="Your name" value={formData.name} onChange={handleFormChange} className="w-full bg-white border border-flour focus:border-gold rounded-lg px-4 py-3 text-sm placeholder:text-brown/50 focus:outline-none" required />
                <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleFormChange} className="w-full bg-white border border-flour focus:border-gold rounded-lg px-4 py-3 text-sm placeholder:text-brown/50 focus:outline-none" required />
              </div>
              <textarea name="message" placeholder="How can we help?" rows={4} value={formData.message} onChange={handleFormChange} className="w-full bg-white border border-flour focus:border-gold rounded-lg px-4 py-3 text-sm placeholder:text-brown/50 focus:outline-none resize-y min-h-[108px]" required />
              <button type="submit" disabled={isSubmitting || formSuccess} className="btn btn-primary w-full disabled:opacity-70">{isSubmitting ? "Sending..." : formSuccess ? "Thank you - we will be in touch" : "Send message"}</button>
              <p className="text-[10px] text-center text-brown/50 pt-1">We usually reply within one business day.</p>
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-deep-brown text-cream/80 py-9 text-xs">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row gap-y-3 md:items-center justify-between">
          <div>© {new Date().getFullYear()} The Last Stop Bakery &amp; Mercantile. Willow Creek, Colorado.</div>
          <div className="flex gap-x-5"><span>Handmade every day</span><span className="hidden md:inline text-cream/30">•</span><span>No two loaves are the same</span></div>
          <div>Made with flour, butter &amp; care</div>
        </div>
      </footer>

      {/* CART MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true" aria-label="Your basket">
            <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 26, stiffness: 280 }} className="ml-auto relative w-full max-w-md bg-white h-full overflow-auto shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <ShoppingBag />
                  <div><div className="font-medium">Your Basket</div><div className="text-xs text-brown/60">{cartCount} items for pickup</div></div>
                </div>
                <button onClick={closeCart} className="p-2 -mr-2 rounded-full hover:bg-flour" aria-label="Close basket"><X /></button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-brown/60">
                  <Heart className="mb-4 text-gold" size={42} />
                  <p className="font-medium text-brown mb-1">Your basket is empty</p>
                  <p className="text-sm">Add some bread or a jar of honey and it will appear here.</p>
                  <button onClick={closeCart} className="btn btn-secondary mt-6 text-sm">Continue browsing</button>
                </div>
              ) : (
                <>
                  <div className="flex-1 px-6 py-2 divide-y text-sm">
                    {cart.map((line) => (
                      <div key={line.item.id} className="cart-item">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-medium leading-tight">{line.item.name}</div>
                          <div className="text-xs text-brown/60 tabular-nums mt-px">${line.item.price.toFixed(2)} × {line.qty}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border border-flour rounded">
                            <button onClick={() => updateCartQty(line.item.id, line.qty - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-flour active:bg-flour/70" aria-label="Decrease quantity"><Minus size={14} /></button>
                            <span className="w-6 text-center font-mono tabular-nums text-xs select-none">{line.qty}</span>
                            <button onClick={() => updateCartQty(line.item.id, line.qty + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-flour active:bg-flour/70" aria-label="Increase quantity"><Plus size={14} /></button>
                          </div>
                          <div className="w-14 text-right font-mono tabular-nums">${(line.item.price * line.qty).toFixed(2)}</div>
                          <button onClick={() => removeFromCart(line.item.id)} className="text-brown/40 hover:text-terracotta p-1" aria-label="Remove item"><X size={15} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="sticky bottom-0 bg-white border-t p-6 space-y-4">
                    <div className="flex justify-between text-lg font-medium"><span>Total</span><span className="font-mono tabular-nums">${cartTotal.toFixed(2)}</span></div>
                    <div className="text-xs leading-snug text-brown/70 bg-flour/60 rounded-lg p-3">Orders are for pickup only at the depot. We will have everything ready for you within 30 minutes of placing your order during open hours.</div>
                    <button onClick={handleCheckout} className="btn btn-primary w-full text-base py-3.5">Place order for pickup</button>
                    <button onClick={closeCart} className="text-xs text-center w-full text-brown/60 hover:text-brown">Continue shopping</button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GALLERY LIGHTBOX */}
      <AnimatePresence>
        {selectedGalleryImage && (
          <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={closeGallery}>
            <button onClick={closeGallery} className="absolute top-4 right-4 text-cream/70 hover:text-cream z-10 p-2" aria-label="Close gallery"><X size={28} /></button>
            <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
              <div className="relative aspect-[16/10] md:aspect-[16/9.2] bg-black rounded-xl overflow-hidden shadow-2xl">
                <img src={selectedGalleryImage.src} alt={selectedGalleryImage.alt} className="absolute inset-0 w-full h-full object-contain" />
              </div>
              <div className="flex items-center justify-between mt-4 px-1 text-cream/90 text-sm">
                <div>{selectedGalleryImage.caption}</div>
                <div className="flex items-center gap-4">
                  <button onClick={() => goToGallery(-1)} className="flex items-center gap-1 hover:text-gold transition px-2 py-1" aria-label="Previous photo">← Prev</button>
                  <span className="text-cream/50 tabular-nums text-xs">{(selectedImageIndex ?? 0) + 1} / {gallery.length}</span>
                  <button onClick={() => goToGallery(1)} className="flex items-center gap-1 hover:text-gold transition px-2 py-1" aria-label="Next photo">Next →</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
