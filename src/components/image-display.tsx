"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Maximize2, FileImage, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { apiService } from '@/services/api';

interface ImageSource {
  type: string;
  content: string;
  image_path?: string;
  filename?: string;
  metadata?: any;
}

interface ImageDisplayProps {
  imageSources: ImageSource[];
  maxDisplay?: number;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageSources, 
  maxDisplay = 4 
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageSource | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  if (!imageSources || imageSources.length === 0) {
    return null;
  }

  const displayImages = imageSources.slice(0, maxDisplay);
  const remainingCount = imageSources.length - maxDisplay;

  const handleImageClick = (imageSource: ImageSource) => {
    setSelectedImage(imageSource);
    setImageDialogOpen(true);
  };

  const getImageUrl = (imageSource: ImageSource): string => {
    if (imageSource.image_path) {
      return apiService.getImageUrl(imageSource.image_path);
    }
    // Fallback for other image sources
    return '';
  };

  const downloadImage = (imageSource: ImageSource) => {
    const imageUrl = getImageUrl(imageSource);
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageSource.filename || 'image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
            <FileImage className="h-4 w-4" />
            <span>Extracted Images</span>
          </h4>
          <Badge variant="secondary" className="text-xs">
            {imageSources.length} image{imageSources.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayImages.map((imageSource, index) => {
            const imageUrl = getImageUrl(imageSource);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: 0.1 * index,
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25 
                }}
                whileHover={{ scale: 1.02 }}
                className="relative bg-muted rounded-lg border overflow-hidden aspect-square group cursor-pointer"
                onClick={() => handleImageClick(imageSource)}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={imageSource.filename || `Extracted image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                
                {/* Fallback for failed images */}
                <div className="hidden w-full h-full flex items-center justify-center bg-muted">
                  <FileImage className="h-8 w-8 text-muted-foreground" />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(imageSource);
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(imageSource);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Image info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {imageSource.filename || `Image ${index + 1}`}
                  </p>
                </div>
              </motion.div>
            );
          })}
          
          {/* Show more indicator */}
          {remainingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.1 * displayImages.length,
                type: "spring", 
                stiffness: 300, 
                damping: 25 
              }}
              className="bg-muted rounded-lg border aspect-square flex flex-col items-center justify-center text-muted-foreground"
            >
              <Plus className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">+{remainingCount} more</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Full screen image dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <AnimatePresence mode="wait">
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <FileImage className="h-5 w-5" />
                    <div>
                      <h3 className="font-medium">
                        {selectedImage.filename || 'Extracted Image'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedImage.content.slice(0, 100)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadImage(selectedImage)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageDialogOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Image */}
                <div className="p-4">
                  <div className="max-h-[70vh] overflow-auto">
                    <img
                      src={getImageUrl(selectedImage)}
                      alt={selectedImage.filename || 'Extracted image'}
                      className="w-full h-auto rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};
