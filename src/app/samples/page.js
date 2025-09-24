'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Eye, Star } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

// Sample products data (in a real app, this would come from an API)
const sampleProducts = [
    {
        id: 1,
        name: "Business Cards",
        description: "Professional business cards with premium finish",
        category: "Stationery",
        basePrice: 25.00,
        image: "/images/business-cards.jpg",
        specifications: {
            material: "Premium cardstock",
            finish: "Matte/Glossy options",
            sizes: ["Standard (3.5x2)", "Square (2.5x2.5)"]
        },
        rating: 4.8,
        reviews: 124
    },
    {
        id: 2,
        name: "Flyers & Brochures",
        description: "Eye-catching promotional materials for your business",
        category: "Marketing",
        basePrice: 15.00,
        image: "/images/flyers.jpg",
        specifications: {
            material: "High-quality paper",
            finish: "Full color printing",
            sizes: ["A4", "A5", "Custom"]
        },
        rating: 4.6,
        reviews: 89
    },
    {
        id: 3,
        name: "Banners & Signs",
        description: "Large format printing for events and promotions",
        category: "Signage",
        basePrice: 45.00,
        image: "/images/banners.jpg",
        specifications: {
            material: "Vinyl/Fabric options",
            finish: "Weather resistant",
            sizes: ["Custom sizes available"]
        },
        rating: 4.7,
        reviews: 67
    },
    {
        id: 4,
        name: "Posters",
        description: "High-quality poster printing for all purposes",
        category: "Displays",
        basePrice: 12.00,
        image: "/images/posters.jpg",
        specifications: {
            material: "Photo paper/Poster paper",
            finish: "Satin/Glossy/Matte",
            sizes: ["A3", "A2", "A1", "A0"]
        },
        rating: 4.5,
        reviews: 156
    },
    {
        id: 5,
        name: "Custom Stickers",
        description: "Personalized stickers for branding and decoration",
        category: "Specialty",
        basePrice: 8.00,
        image: "/images/stickers.jpg",
        specifications: {
            material: "Vinyl/Paper options",
            finish: "Waterproof available",
            sizes: ["Various shapes and sizes"]
        },
        rating: 4.9,
        reviews: 203
    },
    {
        id: 6,
        name: "Greeting Cards",
        description: "Custom greeting cards for special occasions",
        category: "Stationery",
        basePrice: 3.50,
        image: "/images/greeting-cards.jpg",
        specifications: {
            material: "Premium cardstock",
            finish: "Embossed/Foil options",
            sizes: ["5x7", "4x6", "Custom"]
        },
        rating: 4.4,
        reviews: 78
    }
];

export default function SampleProductsPage() {
    const [products, setProducts] = useState(sampleProducts);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Get unique categories
    const categories = ["all", ...new Set(products.map(p => p.category))];

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const requestQuotation = (product) => {
        // In a real app, this would navigate to quotation request page
        alert(`Quotation request for ${product.name} - This would redirect to quotation form`);
    };

    const viewDetails = (product) => {
        setSelectedProduct(product);
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Sample Products</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Explore our range of high-quality printing services. 
                        View samples and request personalized quotations.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(category => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                                className="capitalize"
                            >
                                {category}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <div className="text-4xl mb-2">🎨</div>
                                    <div className="text-sm">Sample Image</div>
                                </div>
                            </div>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{product.name}</CardTitle>
                                        <Badge variant="secondary" className="mt-1">
                                            {product.category}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold">
                                            {formatCurrency(product.basePrice)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            starting from
                                        </div>
                                    </div>
                                </div>
                                <CardDescription>
                                    {product.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Rating */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${
                                                        i < Math.floor(product.rating)
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {product.rating} ({product.reviews} reviews)
                                        </span>
                                    </div>

                                    {/* Key Specifications */}
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium">Specifications:</div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div>• {product.specifications.material}</div>
                                            <div>• {product.specifications.finish}</div>
                                            <div>• Sizes: {product.specifications.sizes.join(", ")}</div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => viewDetails(product)}
                                            className="flex-1"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Details
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => requestQuotation(product)}
                                            className="flex-1"
                                        >
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Get Quote
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* No products found */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Search className="h-16 w-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No products found</h3>
                        <p className="text-muted-foreground">
                            Try adjusting your search or filter criteria
                        </p>
                    </div>
                )}
            </div>

            {/* Product Details Modal would go here */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedProduct(null)}
                                >
                                    ✕
                                </Button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <div className="text-6xl mb-4">🎨</div>
                                        <div>Product Image Gallery</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold mb-2">Description</h3>
                                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold mb-2">Detailed Specifications</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><strong>Material:</strong> {selectedProduct.specifications.material}</div>
                                        <div><strong>Finish:</strong> {selectedProduct.specifications.finish}</div>
                                        <div><strong>Available Sizes:</strong> {selectedProduct.specifications.sizes.join(", ")}</div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={() => requestQuotation(selectedProduct)}
                                        className="flex-1"
                                    >
                                        Request Quotation
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
