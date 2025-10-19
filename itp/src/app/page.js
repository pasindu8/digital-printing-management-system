'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Users,
  Award,
  Truck,
  Shield,
  Palette,
  FileText,
  Image as ImageIcon,
  Calendar,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  User,
  LogOut,
  Settings,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const servicesRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Check for user authentication
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Scroll animation handler
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    router.push('/signup');
  };

  const handleLogin = () => {
      router.push('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setUser(null);
    router.push('/');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="First Promovier Logo"
                className="h-10 w-10 rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold text-[#049532]">First Promovier</h1>
                <p className="text-xs text-gray-600">Professional Printing</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => router.push('/products')}
                className="text-gray-700 hover:text-[#049532] transition-colors"
              >
                Products
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-gray-700 hover:text-[#049532] transition-colors"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-[#049532] transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-700 hover:text-[#049532] transition-colors"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-700 hover:text-[#049532] transition-colors"
              >
                Contact
              </button>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                      <div className="w-8 h-8 bg-[#049532] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {user.name || user.email?.split('@')[0] || 'User'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name || 'Customer'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard/customer')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>My Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/orders')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/customer-billing')}>
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/delivery')}>
                      <Truck className="mr-2 h-4 w-4" />
                      <span>Track Delivery</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleLogin}
                    className="border-[#049532] text-[#049532] hover:bg-[#049532] hover:text-white"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={handleGetStarted}
                    className="gradient-primary text-white hover:opacity-90"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(4, 149, 50, 0.7) 0%, rgba(6, 122, 42, 0.7) 50%, rgba(13, 79, 26, 0.7) 100%), 
                           url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          transform: `translateY(${scrollY * 0.5}px)`
        }}
      >
        {/* Floating Print Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-12 h-12 bg-yellow-300/20 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-40 left-20 w-20 h-20 bg-white/5 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 right-10 w-14 h-14 bg-yellow-300/15 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white border-white/30 w-fit">
                  Professional Printing Services
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  {user ? (
                    <>
                      Welcome back, {user.name?.split(' ')[0] || 'Customer'}! 
                      <span className="text-yellow-300"> Ready to print?</span>
                    </>
                  ) : (
                    <>
                      Bring Your Ideas to Life with 
                      <span className="text-yellow-300"> Premium Printing</span>
                    </>
                  )}
                </h1>
                <p className="text-xl text-gray-100 leading-relaxed">
                  {user ? (
                    "From business cards to large format banners, we deliver exceptional print quality with fast turnaround times. Your vision, our expertise."
                  ) : (
                    "From business cards to large format banners, we deliver exceptional print quality with fast turnaround times. Your vision, our expertise."
                  )}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={user ? () => router.push('/orders') : handleGetStarted}
                  className="bg-white text-[#049532] hover:bg-gray-100 text-lg px-8 py-3"
                >
                  {user ? 'Place New Order' : 'Start Your Project'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => scrollToSection('services')}
                  className="bg-[#049532] text-white hover:bg-[#049532]/90 text-lg px-8 py-3"
                >
                  View Services
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">500+</div>
                  <div className="text-sm text-gray-200">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">24hr</div>
                  <div className="text-sm text-gray-200">Fast Delivery</div>
                </div>
      <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">100%</div>
                  <div className="text-sm text-gray-200">Quality Guarantee</div>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative">
                {/* Print Shop Visual Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-white/20 to-blue-300/20 rounded-full blur-lg animate-bounce" style={{animationDelay: '1s'}}></div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 relative z-10 hover:bg-white/15 transition-all duration-300">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 group">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                        <Printer className="h-6 w-6 text-yellow-300 group-hover:text-yellow-200 transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-yellow-200 transition-colors">Professional Equipment</h3>
                        <p className="text-sm text-gray-200">State-of-the-art printing technology</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 group">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                        <Truck className="h-6 w-6 text-yellow-300 group-hover:text-yellow-200 transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-yellow-200 transition-colors">Fast Delivery</h3>
                        <p className="text-sm text-gray-200">Quick turnaround times</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 group">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                        <Shield className="h-6 w-6 text-yellow-300 group-hover:text-yellow-200 transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-yellow-200 transition-colors">Quality Guarantee</h3>
                        <p className="text-sm text-gray-200">100% satisfaction promise</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section 
        ref={servicesRef}
        id="services" 
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(248, 250, 252, 0.85) 0%, rgba(226, 232, 240, 0.85) 100%), 
                           url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Background Print Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="service-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="none" stroke="%23049532" stroke-width="0.5"/><circle cx="10" cy="10" r="1" fill="%23049532"/></pattern></defs><rect width="100" height="100" fill="url(%23service-pattern)"/></svg>')`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#049532] text-white mb-4 animate-pulse">Our Services</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Complete Printing Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              From small business cards to large format displays, we provide comprehensive 
              printing services to meet all your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Business Cards */}
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-4 bg-gradient-to-br from-[#049532]/10 to-[#067a2a]/10 rounded-full w-fit mb-4 group-hover:bg-gradient-to-br group-hover:from-[#049532]/20 group-hover:to-[#067a2a]/20 transition-all duration-300 group-hover:scale-110">
                  <FileText className="h-8 w-8 text-[#049532] group-hover:text-[#067a2a] transition-colors" />
                </div>
                <CardTitle className="text-xl group-hover:text-[#049532] transition-colors">Business Cards</CardTitle>
                <CardDescription className="group-hover:text-gray-700 transition-colors">
                  Professional business cards with premium finishes
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    Premium cardstock options
                  </li>
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    Spot UV & foil stamping
                  </li>
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    24-hour turnaround
                  </li>
                </ul>
                <Button 
                  className="w-full gradient-primary text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/orders')}
                >
                  Order Now
                </Button>
              </CardContent>
            </Card>

            {/* Banners & Posters */}
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-4 bg-gradient-to-br from-[#049532]/10 to-[#067a2a]/10 rounded-full w-fit mb-4 group-hover:bg-gradient-to-br group-hover:from-[#049532]/20 group-hover:to-[#067a2a]/20 transition-all duration-300 group-hover:scale-110">
                  <ImageIcon className="h-8 w-8 text-[#049532] group-hover:text-[#067a2a] transition-colors" />
                </div>
                <CardTitle className="text-xl group-hover:text-[#049532] transition-colors">Banners & Posters</CardTitle>
                <CardDescription className="group-hover:text-gray-700 transition-colors">
                  Large format printing for events and advertising
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    Up to 3m wide printing
                  </li>
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    Weather-resistant materials
                  </li>
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    Custom sizes available
                  </li>
                </ul>
                <Button 
                  className="w-full gradient-primary text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/orders')}
                >
                  Order Now
                </Button>
              </CardContent>
            </Card>

            {/* Flyers & Brochures */}
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-4 bg-gradient-to-br from-[#049532]/10 to-[#067a2a]/10 rounded-full w-fit mb-4 group-hover:bg-gradient-to-br group-hover:from-[#049532]/20 group-hover:to-[#067a2a]/20 transition-all duration-300 group-hover:scale-110">
                  <Palette className="h-8 w-8 text-[#049532] group-hover:text-[#067a2a] transition-colors" />
                </div>
                <CardTitle className="text-xl group-hover:text-[#049532] transition-colors">Flyers & Brochures</CardTitle>
                <CardDescription className="group-hover:text-gray-700 transition-colors">
                  Marketing materials for your business
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    Full-color printing
                  </li>
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    Various paper weights
                  </li>
                  <li className="flex items-center justify-center group-hover:text-gray-700 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 group-hover:text-[#049532] transition-colors" />
                    Bulk discounts available
                  </li>
                </ul>
                <Button 
                  className="w-full gradient-primary text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/orders')}
                >
                  Order Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        id="features" 
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.85) 100%), 
                           url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-[#049532] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#049532] text-white mb-4 animate-pulse">Why Choose Us</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              We combine cutting-edge technology with exceptional service to deliver 
              outstanding results every time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="mx-auto p-6 bg-gradient-to-br from-[#049532]/10 to-[#067a2a]/10 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[#049532]/20 group-hover:to-[#067a2a]/20 transition-all duration-300">
                <Clock className="h-12 w-12 text-[#049532] group-hover:text-[#067a2a] transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-[#049532] transition-colors">Fast Turnaround</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Most orders completed within 24-48 hours with express options available.
              </p>
            </div>

            <div className="text-center group animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="mx-auto p-6 bg-gradient-to-br from-[#049532]/10 to-[#067a2a]/10 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[#049532]/20 group-hover:to-[#067a2a]/20 transition-all duration-300">
                <Award className="h-12 w-12 text-[#049532] group-hover:text-[#067a2a] transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-[#049532] transition-colors">Premium Quality</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Professional-grade equipment and materials ensure exceptional print quality.
              </p>
            </div>

            <div className="text-center group animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="mx-auto p-6 bg-gradient-to-br from-[#049532]/10 to-[#067a2a]/10 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[#049532]/20 group-hover:to-[#067a2a]/20 transition-all duration-300">
                <Users className="h-12 w-12 text-[#049532] group-hover:text-[#067a2a] transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-[#049532] transition-colors">Expert Team</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Experienced professionals dedicated to bringing your vision to life.
              </p>
            </div>

            <div className="text-center group animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="mx-auto p-6 bg-gradient-to-br from-[#049532]/10 to-[#067a2a]/10 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[#049532]/20 group-hover:to-[#067a2a]/20 transition-all duration-300">
                <Shield className="h-12 w-12 text-[#049532] group-hover:text-[#067a2a] transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-[#049532] transition-colors">Satisfaction Guarantee</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                100% satisfaction guarantee with free reprints if you're not happy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        ref={testimonialsRef}
        id="testimonials" 
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(248, 250, 252, 0.85) 0%, rgba(226, 232, 240, 0.85) 100%), 
                           url('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#049532] text-white mb-4">Testimonials</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what our satisfied customers have to say.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Exceptional quality and service! Our business cards look amazing and were delivered 
                  faster than expected. Highly recommended!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#049532] rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    S
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Johnson</div>
                    <div className="text-sm text-gray-500">Marketing Director</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The banner for our event was perfect! Great attention to detail and the colors 
                  came out exactly as we wanted."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#049532] rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    M
                  </div>
                  <div>
                    <div className="font-semibold">Michael Chen</div>
                    <div className="text-sm text-gray-500">Event Coordinator</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Professional service from start to finish. They helped us with design suggestions 
                  and delivered outstanding results."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#049532] rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    A
                  </div>
                  <div>
                    <div className="font-semibold">Amanda Rodriguez</div>
                    <div className="text-sm text-gray-500">Small Business Owner</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        id="contact" 
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.85) 100%), 
                           url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#049532] text-white mb-4">Contact Us</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to start your next printing project? Contact us today for a free quote.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#049532]/10 rounded-lg">
                  <Phone className="h-6 w-6 text-[#049532]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Phone</h3>
                  <p className="text-gray-600">+94 11 234 5678</p>
                  <p className="text-gray-600">+94 77 123 4567</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#049532]/10 rounded-lg">
                  <Mail className="h-6 w-6 text-[#049532]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Email</h3>
                  <p className="text-gray-600">info@firstpromovier.com</p>
                  <p className="text-gray-600">orders@firstpromovier.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#049532]/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-[#049532]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Address</h3>
                  <p className="text-gray-600">
                    123 Business Street<br />
                    Colombo 03, Sri Lanka
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#049532]/10 rounded-lg">
                  <Clock className="h-6 w-6 text-[#049532]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Business Hours</h3>
                  <p className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-gray-600">Saturday: 9:00 AM - 4:00 PM</p>
                  <p className="text-gray-600">Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <input 
                      type="text" 
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#049532] focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#049532] focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input 
                    type="email" 
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#049532] focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <input 
                    type="tel" 
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#049532] focus:border-transparent"
                    placeholder="+94 77 123 4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <textarea 
                    rows={4}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#049532] focus:border-transparent"
                    placeholder="Tell us about your printing needs..."
                  />
                </div>
                <Button className="w-full gradient-primary text-white">
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="relative py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(31, 41, 55, 0.85) 100%), 
                           url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src="/logo.png"
                  alt="First Promovier Logo"
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">First Promovier</h3>
                  <p className="text-sm text-gray-200">Professional Printing</p>
                </div>
              </div>
              <p className="text-gray-200 text-sm">
                Your trusted partner for all printing needs. Quality, speed, and reliability 
                in every project.
              </p>
              <div className="flex space-x-4">
                <Facebook className="h-5 w-5 text-gray-200 hover:text-white cursor-pointer transition-colors" />
                <Instagram className="h-5 w-5 text-gray-200 hover:text-white cursor-pointer transition-colors" />
                <Twitter className="h-5 w-5 text-gray-200 hover:text-white cursor-pointer transition-colors" />
                <Linkedin className="h-5 w-5 text-gray-200 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Services</h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>Business Cards</li>
                <li>Banners & Posters</li>
                <li>Flyers & Brochures</li>
                <li>Custom Printing</li>
                <li>Large Format</li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li><button onClick={() => router.push('/products')} className="hover:text-white transition-colors">Products</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Services</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">Testimonials</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Contact Info</h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>+94 11 234 5678</li>
                <li>info@firstpromovier.com</li>
                <li>123 Business Street</li>
                <li>Colombo 03, Sri Lanka</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-200">
            <p>&copy; 2025 First Promovier. All rights reserved.</p>
      </div>
      </div>
      </footer>
    </div>
  );
}