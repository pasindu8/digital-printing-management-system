'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Star, 
  Eye,
  Package,
  Truck,
  Shield,
  CheckCircle,
  AlertCircle,
  User,
  LogOut,
  ChevronDown,
  FileText,
  Mail,
  Image as ImageIcon,
  Palette,
  Calendar,
  Gift,
  BookOpen,
  CreditCard,
  X,
  Upload
} from "lucide-react";
import api from "../services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productType: '',
    material: '',
    coloring: '',
    size: '',
    printType: '',
    quantity: 1,
    designSample: null,
    specialInstructions: '',
    urgency: 'standard',
    // Updated delivery address fields for Sri Lankan address format with District
    deliveryAddress: {
      street1: '',
      street2: '',
      city: '',
      district: '',
      state: '',
      zip: '',
      country: 'Sri Lanka'
    }
  });
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(500);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState({
    processingCost: 0,
    materialCost: 0,
    deliveryCharge: 500,
    total: 0
  });

  // Print product categories
  const categories = ['All', 'Business Cards', 'Brochures', 'Flyers', 'Posters', 'Banners', 'Stickers', 'Booklets', 'Invitations', 'Postcards', 'Other'];

  // Sri Lankan cities and their approximate distance from Panadura (in KM)
  const cityDistances = {
    'Panadura': 0,
    'Colombo': 25,
    'Gampaha': 35,
    'Kalutara': 20,
    'Moratuwa': 15,
    'Dehiwala': 20,
    'Mount Lavinia': 18,
    'Negombo': 45,
    'Kandy': 120,
    'Galle': 90,
    'Matara': 140,
    'Ratnapura': 95,
    'Kurunegala': 85,
    'Anuradhapura': 180,
    'Trincomalee': 250,
    'Batticaloa': 280,
    'Jaffna': 400,
    'Badulla': 200,
    'Nuwara Eliya': 160,
    'Polonnaruwa': 220
  };

  // Sri Lankan Provinces, Districts, and Cities with delivery distances
  const sriLankanLocationData = {
    'Western': {
      districts: {
        'Colombo': {
          cities: ['Colombo', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Kelaniya', 'Maharagama', 'Kotte', 'Kolonnawa']
        },
        'Gampaha': {
          cities: ['Gampaha', 'Negombo', 'Ja-Ela', 'Wattala', 'Minuwangoda', 'Divulapitiya', 'Mirigama', 'Veyangoda']
        },
        'Kalutara': {
          cities: ['Kalutara', 'Panadura', 'Horana', 'Beruwala', 'Bentota', 'Aluthgama', 'Matugama', 'Bandaragama']
        }
      }
    },
    'Central': {
      districts: {
        'Kandy': {
          cities: ['Kandy', 'Gampola', 'Nawalapitiya', 'Peradeniya', 'Kadugannawa', 'Pilimatalawa', 'Harispattuwa', 'Udunuwara']
        },
        'Matale': {
          cities: ['Matale', 'Dambulla', 'Sigiriya', 'Galewela', 'Ukuwela', 'Pallepola', 'Rattota', 'Yatawatta']
        },
        'Nuwara Eliya': {
          cities: ['Nuwara Eliya', 'Hatton', 'Talawakele', 'Ginigathena', 'Kotagala', 'Maskeliya', 'Bogawantalawa', 'Walapane']
        }
      }
    },
    'Southern': {
      districts: {
        'Galle': {
          cities: ['Galle', 'Hikkaduwa', 'Ambalangoda', 'Bentota', 'Elpitiya', 'Karapitiya', 'Baddegama', 'Yakkalamulla']
        },
        'Matara': {
          cities: ['Matara', 'Weligama', 'Mirissa', 'Dikwella', 'Hakmana', 'Akuressa', 'Kamburupitiya', 'Devinuwara']
        },
        'Hambantota': {
          cities: ['Hambantota', 'Tangalle', 'Tissamaharama', 'Ambalantota', 'Beliatta', 'Weeraketiya', 'Kataragama', 'Okewela']
        }
      }
    },
    'Eastern': {
      districts: {
        'Batticaloa': {
          cities: ['Batticaloa', 'Kalmunai', 'Eravur', 'Valaichchenai', 'Chenkaladi', 'Oddamavadi', 'Koralai Pattu', 'Manmunai North']
        },
        'Ampara': {
          cities: ['Ampara', 'Akkaraipattu', 'Kalmunai', 'Sammanthurai', 'Nintavur', 'Addalachchenai', 'Alayadivembu', 'Dehiattakandiya']
        },
        'Trincomalee': {
          cities: ['Trincomalee', 'Kinniya', 'Mutur', 'Kuchchaveli', 'Kantale', 'Seruvila', 'Thambalagamuwa', 'Gomarankadawala']
        }
      }
    },
    'Northern': {
      districts: {
        'Jaffna': {
          cities: ['Jaffna', 'Point Pedro', 'Chavakachcheri', 'Nallur', 'Kondavil', 'Kopay', 'Manipay', 'Sandilipay']
        },
        'Kilinochchi': {
          cities: ['Kilinochchi', 'Pallai', 'Paranthan', 'Poonakary', 'Akkarayankulam', 'Elephant Pass', 'Vishvamadu', 'Uruthirapuram']
        },
        'Mannar': {
          cities: ['Mannar', 'Nanattan', 'Madhu', 'Pesalai', 'Thalvupadu', 'Erukkalampiddy', 'Vidattaltivu', 'Nanaddan']
        },
        'Mullaitivu': {
          cities: ['Mullaitivu', 'Puthukkudiyiruppu', 'Oddusuddan', 'Thunukkai', 'Welipennai', 'Manthai East', 'Kokkilai', 'Chemmalai']
        },
        'Vavuniya': {
          cities: ['Vavuniya', 'Nedunkeni', 'Settikulam', 'Omanthai', 'Vengalacheddikulam', 'Puliyankulam', 'Kebitigollewa', 'Thambalagamuwa']
        }
      }
    },
    'North Western': {
      districts: {
        'Kurunegala': {
          cities: ['Kurunegala', 'Kuliyapitiya', 'Narammala', 'Wariyapola', 'Pannala', 'Melsiripura', 'Bingiriya', 'Bamunakotuwa']
        },
        'Puttalam': {
          cities: ['Puttalam', 'Chilaw', 'Wennappuwa', 'Anamaduwa', 'Nattandiya', 'Dankotuwa', 'Marawila', 'Mundel']
        }
      }
    },
    'North Central': {
      districts: {
        'Anuradhapura': {
          cities: ['Anuradhapura', 'Kekirawa', 'Habarana', 'Mihintale', 'Medawachchiya', 'Galkiriyagama', 'Tambuttegama', 'Eppawala']
        },
        'Polonnaruwa': {
          cities: ['Polonnaruwa', 'Kaduruwela', 'Medirigiriya', 'Hingurakgoda', 'Dimbulagala', 'Lankapura', 'Welikanda', 'Thamankaduwa']
        }
      }
    },
    'Uva': {
      districts: {
        'Badulla': {
          cities: ['Badulla', 'Bandarawela', 'Ella', 'Haputale', 'Welimada', 'Mahiyanganaya', 'Passara', 'Haldummulla']
        },
        'Monaragala': {
          cities: ['Monaragala', 'Wellawaya', 'Buttala', 'Kataragama', 'Bibila', 'Medagama', 'Siyambalanduwa', 'Madulla']
        }
      }
    },
    'Sabaragamuwa': {
      districts: {
        'Ratnapura': {
          cities: ['Ratnapura', 'Balangoda', 'Embilipitiya', 'Kuruwita', 'Eheliyagoda', 'Nivithigala', 'Pelmadulla', 'Kahawatta']
        },
        'Kegalle': {
          cities: ['Kegalle', 'Mawanella', 'Rambukkana', 'Warakapola', 'Galigamuwa', 'Yatiyantota', 'Ruwanwella', 'Deraniyagala']
        }
      }
    }
  };

  const getDistrictsForProvince = (provinceName) => {
    if (!provinceName || !sriLankanLocationData[provinceName]) return [];
    return Object.keys(sriLankanLocationData[provinceName].districts);
  };

  const getCitiesForDistrict = (provinceName, districtName) => {
    if (!provinceName || !districtName || 
        !sriLankanLocationData[provinceName] || 
        !sriLankanLocationData[provinceName].districts[districtName]) return [];
    
    return sriLankanLocationData[provinceName].districts[districtName].cities.map(city => ({
      name: city,
      distance: cityDistances[city] || 100 // Default 100km if not found
    }));
  };

  // Calculate delivery charge based on distance from Panadura
  const calculateDeliveryCharge = (city) => {
    const distance = cityDistances[city] || 50; // Default 50km if city not found
    if (distance === 0) return 0; // Free delivery for Panadura
    return Math.ceil(distance / 10) * 100; // Rs 100 per 10km (rounded up)
  };

  // Material mappings from orders page
  const allMaterials = [
    'Standard Paper (80gsm)', 'Premium Paper (120gsm)', 'Cardstock (250gsm)', 
    'Glossy Paper', 'Matte Paper', 'Recycled Paper', 'Vinyl', 'Fabric', 'Canvas'
  ];

  // Material mapping from order materials to raw materials
  const materialToRawMaterialMapping = {
    'Standard Paper (80gsm)': 'A4 Premium White Paper',
    'Premium Paper (120gsm)': 'A4 Premium White Paper',
    'Cardstock (250gsm)': 'Cardstock 300gsm White',
    'Glossy Paper': 'A3 Photo Paper Glossy',
    'Matte Paper': 'A4 Premium White Paper',
    'Recycled Paper': 'A4 Premium White Paper',
    'Vinyl': 'Vinyl Banner Material',
    'Fabric': 'Vinyl Banner Material',
    'Canvas': 'Vinyl Banner Material'
  };

  // Material mapping by product type
  const materialMapping = {
    'Business Cards': ['Cardstock (250gsm)', 'Premium Paper (120gsm)', 'Glossy Paper', 'Matte Paper'],
    'Brochures': ['Standard Paper (80gsm)', 'Premium Paper (120gsm)', 'Glossy Paper', 'Matte Paper'],
    'Flyers': ['Standard Paper (80gsm)', 'Premium Paper (120gsm)', 'Glossy Paper', 'Recycled Paper'],
    'Posters': ['Premium Paper (120gsm)', 'Glossy Paper', 'Matte Paper', 'Canvas'],
    'Banners': ['Vinyl', 'Fabric', 'Canvas'],
    'Stickers': ['Vinyl', 'Glossy Paper', 'Matte Paper'],
    'Booklets': ['Standard Paper (80gsm)', 'Premium Paper (120gsm)', 'Matte Paper', 'Recycled Paper'],
    'Invitations': ['Cardstock (250gsm)', 'Premium Paper (120gsm)', 'Glossy Paper'],
    'Postcards': ['Cardstock (250gsm)', 'Glossy Paper', 'Matte Paper'],
    'Other': allMaterials
  };

  // Coloring options
  const colorOptions = [
    'Black & White', 'Single Color', 'Two Color', 'Full Color (CMYK)', 'Spot Colors'
  ];

  // Size options
  const sizeOptions = [
    'A4 (210x297mm)', 'A5 (148x210mm)', 'A6 (105x148mm)', 
    'Letter (8.5x11")', 'Business Card (85x55mm)', 'Custom Size'
  ];

  // Print types
  const printTypes = [
    'Digital Print', 'Offset Print', 'Large Format', 'Screen Print', 'Letterpress'
  ];

  // Get materials for selected product
  const getMaterialsForProduct = (productType) => {
    return materialMapping[productType] || [];
  };

  // Get raw material data
  const getRawMaterialData = (orderMaterial) => {
    const rawMaterialName = materialToRawMaterialMapping[orderMaterial];
    return rawMaterials.find(rm => rm.material_name === rawMaterialName);
  };

  // Fetch raw materials
  const fetchRawMaterials = async () => {
    try {
      setMaterialsLoading(true);
      const response = await fetch('http://localhost:5000/api/raw-materials');
      const data = await response.json();
      setRawMaterials(data);
    } catch (error) {
      console.error('Error fetching raw materials:', error);
    } finally {
      setMaterialsLoading(false);
    }
  };

  // Price calculation function
  const calculatePrice = () => {
    let basePrice = 0;
    let materialCost = 0;
    
    if (!formData.productType || !formData.material || !formData.coloring || !formData.size || !formData.printType) {
      setEstimatedPrice(0);
      setPriceBreakdown({
        processingCost: 0,
        materialCost: 0,
        deliveryCharge: 500,
        total: 500
      });
      return;
    }

    // Material cost calculation
    if (formData.material) {
      const rawMaterial = getRawMaterialData(formData.material);
      if (rawMaterial) {
        // Calculate material usage per item
        let usagePerItem = 1; // Base usage
        
        // Adjust usage based on product size
        if (formData.size) {
          if (formData.size.includes('A3')) usagePerItem *= 2;
          if (formData.size.includes('Business Card')) usagePerItem *= 0.1;
        }
        
        // Adjust for product type
        if (formData.productType === 'Banners' || formData.productType === 'Posters') {
          usagePerItem *= 0.5; // Different measurement unit
        }
        
        // Add waste factor
        usagePerItem *= 1.1;
        
        materialCost = rawMaterial.unit_cost * usagePerItem * formData.quantity;
      }
    }
    
    // Base processing cost (labor, machine time, etc.)
    const productPrices = {
      'Business Cards': 0.3,
      'Brochures': 0.8,
      'Flyers': 0.5,
      'Posters': 2.0,
      'Banners': 5.0,
      'Stickers': 0.4,
      'Booklets': 1.0,
      'Invitations': 0.3,
      'Postcards': 0.25,
      'Other': 0.5
    };
    
        basePrice = productPrices[formData.productType] || 0;
    
    // Material multiplier (processing difficulty multiplier)
    const materialMultipliers = {
      'Standard Paper (80gsm)': 1.0,
      'Premium Paper (120gsm)': 1.1,
      'Cardstock (250gsm)': 1.2,
      'Glossy Paper': 1.15,
      'Matte Paper': 1.05,
      'Recycled Paper': 1.0,
      'Vinyl': 1.5,
      'Fabric': 1.8,
      'Canvas': 2.0
    };
    
    basePrice *= materialMultipliers[formData.material] || 1.0;
    
    // Color multiplier
    const colorMultipliers = {
      'Black & White': 1.0,
      'Single Color': 1.2,
      'Two Color': 1.4,
      'Full Color (CMYK)': 1.8,
      'Spot Colors': 2.0
    };
    
    basePrice *= colorMultipliers[formData.coloring] || 1.0;
    
    // Print type multiplier
    const printTypeMultipliers = {
      'Digital Print': 1.0,
      'Offset Print': 1.3,
      'Large Format': 2.0,
      'Screen Print': 1.5,
      'Letterpress': 2.5
    };
    
    basePrice *= printTypeMultipliers[formData.printType] || 1.0;
    
    // Quantity (bulk discount)
    let quantityPrice = basePrice * formData.quantity;
    if (formData.quantity >= 1000) {
      quantityPrice *= 0.8; // 20% discount for 1000+
    } else if (formData.quantity >= 500) {
      quantityPrice *= 0.9; // 10% discount for 500+
    }
    
    // Urgency multiplier
    const urgencyMultipliers = {
      'standard': 1.0,
      'express': 1.5,
      'rush': 2.0
    };
    
    quantityPrice *= urgencyMultipliers[formData.urgency] || 1.0;
    
    // Calculate final price
    const processingCost = quantityPrice;
    const total = processingCost + materialCost + deliveryCharge;
    
    setEstimatedPrice(total);
    setPriceBreakdown({
      processingCost: processingCost,
      materialCost: materialCost,
      deliveryCharge: deliveryCharge,
      total: Math.max(total, 5) // Minimum Rs 5
    });
  };

  // Order submission function (exact copy from orders page)
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productType || !formData.material || !formData.coloring || !formData.size || !formData.printType) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.deliveryAddress.street1 || !formData.deliveryAddress.city || !formData.deliveryAddress.district || !formData.deliveryAddress.state) {
      alert('Please fill in the required delivery address fields (Street 1, Province, District, and City)');
      return;
    }

    // Check material stock availability
    const rawMaterial = getRawMaterialData(formData.material);
    if (rawMaterial && rawMaterial.current_stock === 0) {
      alert('Selected material is out of stock. Please choose a different material.');
      return;
    }

    // Check if sufficient stock for order quantity
    if (rawMaterial) {
      let usagePerItem = 1;
      if (formData.size && formData.size.includes('A3')) usagePerItem *= 2;
      if (formData.size && formData.size.includes('Business Card')) usagePerItem *= 0.1;
      if (formData.productType === 'Banners' || formData.productType === 'Posters') usagePerItem *= 0.5;
      usagePerItem *= 1.1; // Waste factor
      
      const totalUsage = Math.ceil(usagePerItem * formData.quantity);
      if (rawMaterial.current_stock < totalUsage) {
        alert(`Insufficient material stock. Available: ${rawMaterial.current_stock} ${rawMaterial.unit_of_measurement}, Required: ${totalUsage} ${rawMaterial.unit_of_measurement}`);
        return;
      }
    }

    setOrderLoading(true);
    try {
      // Calculate unit price
      const unitPrice = estimatedPrice / formData.quantity;
      
      const orderData = {
        customer_name: user?.name || user?.email || 'Guest User',
        customer_email: user?.email || '',
        customer_phone: user?.phone || '',
        customer_address: `${formData.deliveryAddress.street1}${formData.deliveryAddress.street2 ? ', ' + formData.deliveryAddress.street2 : ''}, ${formData.deliveryAddress.city}, ${formData.deliveryAddress.district}, ${formData.deliveryAddress.state}${formData.deliveryAddress.zip ? ', ' + formData.deliveryAddress.zip : ''}, ${formData.deliveryAddress.country}`,
        customer_id: user?.customerId || user?.id || 'guest',
        order_type: 'standard',
        delivery_address: formData.deliveryAddress,
        delivery_charge: deliveryCharge,
        items: [{
          product: formData.productType,
          quantity: formData.quantity,
          unit_price: unitPrice,
          specifications: JSON.stringify({
            material: formData.material,
            coloring: formData.coloring,
            size: formData.size,
            printType: formData.printType,
            urgency: formData.urgency,
            deliveryCity: formData.deliveryAddress.city
          })
        }],
        total: estimatedPrice,
        final_amount: estimatedPrice,
        product_total: estimatedPrice - deliveryCharge, // Product price without delivery
        status: 'New',
        priority: formData.urgency === 'rush' ? 'urgent' : formData.urgency === 'express' ? 'high' : 'normal',
        notes: formData.specialInstructions || '',
        special_instructions: formData.specialInstructions || '',
        delivery_date: new Date(Date.now() + (formData.urgency === 'rush' ? 2 : formData.urgency === 'express' ? 5 : 7) * 24 * 60 * 60 * 1000),
        expected_completion_date: new Date(Date.now() + (formData.urgency === 'rush' ? 1 : formData.urgency === 'express' ? 3 : 5) * 24 * 60 * 60 * 1000)
      };

      await api.post('/orders', orderData);
      setIsModalOpen(false);
      alert('Order placed successfully! You will receive a confirmation email shortly.');
      
      // Reset form
      setFormData({
        productType: '',
        material: '',
        coloring: '',
        size: '',
        printType: '',
        quantity: 1,
        designSample: null,
        specialInstructions: '',
        urgency: 'standard',
        deliveryAddress: {
          street1: '',
          street2: '',
          city: '',
          district: '',
          state: '',
          zip: '',
          country: 'Sri Lanka'
        }
      });
      
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  // Sample print products data
  const printProducts = [
    {
      id: 1,
      name: 'Business Cards',
      category: 'Business Cards',
      description: 'Professional business cards with premium finishes and custom designs.',
      image: 'https://cdn.dribbble.com/userupload/18109364/file/original-0d815e17c94da7af48290f32273d956a.png?resize=1500x1125&vertical=center',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      name: 'Brochures',
      category: 'Brochures',
      description: 'Tri-fold brochures perfect for marketing campaigns and product showcases.',
      image: 'https://printo.ae/wp-content/uploads/2023/11/Express-Brochure-1.jpg',
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      id: 3,
      name: 'Flyers',
      category: 'Flyers',
      description: 'Eye-catching flyers for events, promotions, and announcements.',
      image: 'https://rynoprinting.com/wp-content/uploads/custom-flyer-printing-size-examples-768x512.png',
      icon: ImageIcon,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      name: 'Posters',
      category: 'Posters',
      description: 'Large format posters for events, advertising, and decorative purposes.',
      image: 'https://www.nottinghamprinting.com/wp-content/uploads/2020/03/Posters.png',
      icon: ImageIcon,
      color: 'bg-orange-500'
    },
    {
      id: 5,
      name: 'Banners',
      category: 'Banners',
      description: 'Durable vinyl banners for outdoor events and advertising campaigns.',
      image: 'https://cdn.printnetwork.com/production/assets/5966561450122033bd4456f8/imageLocker/product/5b2ade00a5449bab7de6a995/Custom_Vinyl_Banners_1664467736814.jpg',
      icon: Package,
      color: 'bg-red-500'
    },
    {
      id: 6,
      name: 'Stickers',
      category: 'Stickers',
      description: 'High-quality vinyl stickers for branding and promotional purposes.',
      image: 'https://customany.com/wp-content/uploads/2024/03/Find-sticker-printing-solutions.jpg',
      icon: Gift,
      color: 'bg-pink-500'
    },
    {
      id: 7,
      name: 'Booklets',
      category: 'Booklets',
      description: 'Professional booklets for catalogs, manuals, and documentation.',
      image: 'https://homeinnkprint.com/cdn/shop/products/booklets-2-min.jpg?v=1597912729&width=720',
      icon: BookOpen,
      color: 'bg-indigo-500'
    },
    {
      id: 8,
      name: 'Invitations',
      category: 'Invitations',
      description: 'Elegant invitations with premium papers and beautiful finishes.',
      image: 'https://blogcdn.paperlust.co/blog/wp-content/uploads/2021/11/1.jpg',
      icon: Calendar,
      color: 'bg-rose-500'
    },
    {
      id: 9,
      name: 'Postcards',
      category: 'Postcards',
      description: 'High-quality postcards for direct mail campaigns and promotions.',
      image: 'https://5.imimg.com/data5/QL/XK/DA/SELLER-16102056/printed-paper-postcard-1000x1000.jpg',
      icon: Mail,
      color: 'bg-cyan-500'
    },
    {
      id: 10,
      name: 'Other Products',
      category: 'Other',
      description: 'Custom labels, packaging, and specialized printing services.',
      image: 'https://4.imimg.com/data4/YQ/XD/MY-11047603/99900b51e59ccf4811190ac47b355228-500x500.jpg',
      icon: Package,
      color: 'bg-teal-500'
    }
  ];

  useEffect(() => {
    setProducts(printProducts);
    
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
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Fetch raw materials on component mount
  useEffect(() => {
    fetchRawMaterials();
  }, []);

  // Calculate price when form data changes
  useEffect(() => {
    calculatePrice();
  }, [formData.productType, formData.material, formData.coloring, formData.size, formData.printType, formData.quantity, formData.urgency, rawMaterials]);

  // Reset material when product changes
  useEffect(() => {
    if (formData.productType && !getMaterialsForProduct(formData.productType).includes(formData.material)) {
      setFormData(prev => ({ ...prev, material: '' }));
    }
  }, [formData.productType]);

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Business Cards': 'bg-blue-100 text-blue-800',
      'Brochures': 'bg-green-100 text-green-800',
      'Flyers': 'bg-purple-100 text-purple-800',
      'Posters': 'bg-orange-100 text-orange-800',
      'Banners': 'bg-red-100 text-red-800',
      'Stickers': 'bg-pink-100 text-pink-800',
      'Booklets': 'bg-indigo-100 text-indigo-800',
      'Invitations': 'bg-rose-100 text-rose-800',
      'Postcards': 'bg-cyan-100 text-cyan-800',
      'Other': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setUser(null);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="First Promovier Logo"
                className="h-7 w-7 rounded-full"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-800">First Promovier</h1>
                <p className="text-xs text-gray-500">Products Catalog</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-[#049532] transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => router.push('/products')}
                className="text-[#049532] font-medium"
              >
                Products
              </button>
              <button 
                onClick={() => {
                  router.push('/');
                  setTimeout(() => {
                    const servicesSection = document.getElementById('services');
                    if (servicesSection) {
                      servicesSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="text-gray-600 hover:text-[#049532] transition-colors"
              >
                Services
              </button>
              <button 
                onClick={() => {
                  router.push('/');
                  setTimeout(() => {
                    const featuresSection = document.getElementById('features');
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="text-gray-600 hover:text-[#049532] transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => {
                  router.push('/');
                  setTimeout(() => {
                    const contactSection = document.getElementById('contact');
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="text-gray-600 hover:text-[#049532] transition-colors"
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
                    <DropdownMenuItem onClick={() => router.push('/billing')}>
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Billing</span>
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
                    onClick={() => router.push('/login')}
                    className="border-[#049532] text-[#049532] hover:bg-[#049532] hover:text-white"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => router.push('/login')}
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
      <section className="gradient-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Our Print Products
            </h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto">
              Explore our comprehensive range of professional printing services. 
              From business cards to large format banners, we deliver exceptional quality for all your printing needs.
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="bg-white py-6 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "gradient-primary text-white" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#049532]"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          <div className="mb-8">
            <p className="text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const ProductIcon = product.icon;
                
                return (
                  <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden cursor-pointer"                 onClick={() => {
                  setSelectedProduct(product);
                  setFormData(prev => ({ ...prev, productType: product.name }));
                  setIsModalOpen(true);
                }}>
                        {/* Product Image */}
                        <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Category Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={getCategoryColor(product.category)}>
                          {product.category}
                        </Badge>
                      </div>
                    </div>

                        <CardContent className="p-8">
                      {/* Product Info */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                          <div className={`p-3 ${product.color} rounded-lg`}>
                            <ProductIcon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-xl">
                            {product.name}
                          </h3>
                        </div>
                        <p className="text-gray-600 text-base">
                          {product.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Print Services?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine cutting-edge printing technology with exceptional service to deliver outstanding results every time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto p-4 bg-[#049532]/10 rounded-full w-fit mb-4">
                <Shield className="h-8 w-8 text-[#049532]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Quality</h3>
              <p className="text-gray-600">
                Professional-grade equipment and materials ensure exceptional print quality for all your projects.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto p-4 bg-[#049532]/10 rounded-full w-fit mb-4">
                <Truck className="h-8 w-8 text-[#049532]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick turnaround times with same-day processing for urgent orders and reliable delivery schedules.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto p-4 bg-[#049532]/10 rounded-full w-fit mb-4">
                <CheckCircle className="h-8 w-8 text-[#049532]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Satisfaction Guarantee</h3>
              <p className="text-gray-600">
                100% satisfaction guarantee with free reprints if you're not completely happy with the results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img
              src="/logo.png"
              alt="First Promovier Logo"
              className="h-8 w-8 rounded-full"
            />
            <div>
              <h3 className="text-lg font-bold">First Promovier</h3>
              <p className="text-sm text-gray-400">Professional Printing</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; 2025 First Promovier. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Product Customization Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {selectedProduct && (
                <>
                  <div className={`p-2 ${selectedProduct.color} rounded-lg`}>
                    <selectedProduct.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                    <p className="text-gray-600">{selectedProduct.description}</p>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Customize your {selectedProduct?.name} order. Fill out the details below and we'll calculate the price automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Customer:</label>
                  <p className="text-sm text-gray-600">{user?.name || 'Guest User'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email:</label>
                  <p className="text-sm text-gray-600">{user?.email || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Product Customization Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Type */}
              <div>
                <label className="text-sm font-medium text-gray-700">Product Type *</label>
                <Input
                  value={formData.productType}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              {/* Material */}
              <div>
                <label className="text-sm font-medium text-gray-700">Material *</label>
                <div className="mt-1 p-3 border rounded-lg">
                  {materialsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#049532] mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading materials...</p>
                    </div>
                  ) : formData.productType ? (
                    <div className="grid grid-cols-1 gap-3">
                      {getMaterialsForProduct(formData.productType).map((material) => {
                        const rawMaterial = getRawMaterialData(material);
                        const isOutOfStock = rawMaterial && rawMaterial.current_stock === 0;
                        const isLowStock = rawMaterial && rawMaterial.current_stock <= rawMaterial.minimum_stock_level && rawMaterial.current_stock > 0;
                        
                        return (
                          <div
                            key={material}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              formData.material === material
                                ? 'border-blue-500 bg-blue-50'
                                : isOutOfStock
                                ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => !isOutOfStock && setFormData(prev => ({ ...prev, material }))}
                          >
                            <div className="flex gap-3 items-start">
                              {/* Material Image */}
                              {rawMaterial && rawMaterial.image && rawMaterial.image.directLink && (
                                <div className="flex-shrink-0">
                                  <img 
                                    src={rawMaterial.image.directLink} 
                                    alt={rawMaterial.material_name}
                                    className="w-20 h-20 object-cover rounded border"
                                    onError={(e) => {
                                      // Try alternate link if primary fails
                                      if (rawMaterial.image.alternateLink && e.target.src !== rawMaterial.image.alternateLink) {
                                        e.target.src = rawMaterial.image.alternateLink;
                                      } else {
                                        e.target.style.display = 'none';
                                      }
                                    }}
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1 flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{material}</h4>
                                    {isOutOfStock && (
                                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                        Out of Stock
                                      </span>
                                    )}
                                    {isLowStock && !isOutOfStock && (
                                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                        Low Stock
                                      </span>
                                    )}
                                  </div>
                                  {rawMaterial && (
                                    <div className="mt-1 text-sm text-gray-600">
                                      <p>Raw Material: {rawMaterial.material_name}</p>
                                      <p>Available: {rawMaterial.current_stock} {rawMaterial.unit_of_measurement}</p>
                                      {rawMaterial.description && (
                                        <p className="text-xs text-gray-500 mt-1">{rawMaterial.description}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  {rawMaterial && (
                                    <p className="text-sm font-medium text-green-600">
                                      Rs. {rawMaterial.unit_cost?.toFixed(2)}/{rawMaterial.unit_of_measurement}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Please select a product type first</p>
                  )}
                </div>
              </div>

              {/* Coloring */}
              <div>
                <label className="text-sm font-medium text-gray-700">Coloring *</label>
                <Select value={formData.coloring} onValueChange={(value) => setFormData(prev => ({ ...prev, coloring: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select coloring option" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size */}
              <div>
                <label className="text-sm font-medium text-gray-700">Size *</label>
                <Select value={formData.size} onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Print Type */}
              <div>
                <label className="text-sm font-medium text-gray-700">Print Type *</label>
                <Select value={formData.printType} onValueChange={(value) => setFormData(prev => ({ ...prev, printType: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select print type" />
                  </SelectTrigger>
                  <SelectContent>
                    {printTypes.map((printType) => (
                      <SelectItem key={printType} value={printType}>{printType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium text-gray-700">Quantity *</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="mt-1"
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="text-sm font-medium text-gray-700">Urgency</label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (7 days) - No extra charge</SelectItem>
                    <SelectItem value="express">Express (3 days) - +25%</SelectItem>
                    <SelectItem value="rush">Rush (1 day) - +50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Street Address 1 *</label>
                  <Input
                    placeholder="Enter street address line 1"
                    value={formData.deliveryAddress.street1}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliveryAddress: { ...prev.deliveryAddress, street1: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Street Address 2</label>
                  <Input
                    placeholder="Enter street address line 2 (optional)"
                    value={formData.deliveryAddress.street2}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliveryAddress: { ...prev.deliveryAddress, street2: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Province/State *</label>
                  <Select 
                    value={formData.deliveryAddress.state} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      deliveryAddress: { 
                        ...prev.deliveryAddress, 
                        state: value,
                        district: '', // Reset district when province changes
                        city: '' // Reset city when province changes
                      }
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select province/state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Western">Western Province</SelectItem>
                      <SelectItem value="Central">Central Province</SelectItem>
                      <SelectItem value="Southern">Southern Province</SelectItem>
                      <SelectItem value="Northern">Northern Province</SelectItem>
                      <SelectItem value="Eastern">Eastern Province</SelectItem>
                      <SelectItem value="North Western">North Western Province</SelectItem>
                      <SelectItem value="North Central">North Central Province</SelectItem>
                      <SelectItem value="Uva">Uva Province</SelectItem>
                      <SelectItem value="Sabaragamuwa">Sabaragamuwa Province</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">District *</label>
                  <Select 
                    value={formData.deliveryAddress.district} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      deliveryAddress: { 
                        ...prev.deliveryAddress, 
                        district: value,
                        city: '' // Reset city when district changes
                      }
                    }))}
                    disabled={!formData.deliveryAddress.state}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={
                        formData.deliveryAddress.state ? "Select district" : "Select province first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {getDistrictsForProvince(formData.deliveryAddress.state).map((district) => (
                        <SelectItem key={district} value={district}>
                          {district} District
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">City *</label>
                  <Select 
                    value={formData.deliveryAddress.city} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        deliveryAddress: { ...prev.deliveryAddress, city: value }
                      }));
                      // Update delivery charge based on city
                      const newDeliveryCharge = calculateDeliveryCharge(value);
                      setDeliveryCharge(newDeliveryCharge);
                    }}
                    disabled={!formData.deliveryAddress.district}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={
                        formData.deliveryAddress.district ? "Select city" : "Select district first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {getCitiesForDistrict(formData.deliveryAddress.state, formData.deliveryAddress.district).map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name} ({city.distance}km)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ZIP/Postal Code</label>
                  <Input
                    placeholder="Enter ZIP/postal code"
                    value={formData.deliveryAddress.zip}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliveryAddress: { ...prev.deliveryAddress, zip: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <Input
                    value="Sri Lanka"
                    disabled
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Design Sample */}
            <div>
              <label className="text-sm font-medium text-gray-700">Design Sample</label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Upload your design file (JPG, PNG, PDF, AI, EPS) - Optional</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.ai,.eps"
                  onChange={(e) => setFormData(prev => ({ ...prev, designSample: e.target.files[0] }))}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="text-sm font-medium text-gray-700">Special Instructions</label>
              <Textarea
                placeholder="Any special requirements or notes for your order..."
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Price Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Processing Cost:</span>
                  <span>Rs. {priceBreakdown.processingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Material Cost:</span>
                  <span>Rs. {priceBreakdown.materialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span>Rs. {priceBreakdown.deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total Price:</span>
                  <span>Rs. {priceBreakdown.total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Final price may vary based on design complexity and final specifications
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
                <Button 
                  className="gradient-primary text-white"
                  onClick={handleOrderSubmit}
                  disabled={orderLoading}
                >
                  {orderLoading ? 'Placing Order...' : 'Place Order'}
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}