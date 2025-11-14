'use client';

import { useState } from 'react';
import {
  Share2,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle as WhatsApp,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/app/_shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/_shared/components/ui/dropdown-menu';
import {
  shareNative,
  getShareUrls,
  openSharePopup,
  copyToClipboard,
  type ShareData,
} from '@/app/_shared/lib/utils/share';

interface ShareButtonProps {
  shareData: ShareData;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ShareButton({
  shareData,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleNativeShare = async () => {
    const success = await shareNative(shareData);
    if (success) {
      setIsOpen(false);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareData.url);
    if (success) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    }
  };

  const handleSocialShare = (platform: keyof ReturnType<typeof getShareUrls>) => {
    const urls = getShareUrls(shareData);
    openSharePopup(urls[platform]);
    setIsOpen(false);
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          {showLabel && <span className="hidden sm:inline">Del</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {hasNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Del...</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={() => handleSocialShare('facebook')}>
          <Facebook className="mr-2 h-4 w-4" />
          <span>Del på Facebook</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare('twitter')}>
          <Twitter className="mr-2 h-4 w-4" />
          <span>Del på X</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare('linkedin')}>
          <Linkedin className="mr-2 h-4 w-4" />
          <span>Del på LinkedIn</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare('whatsapp')}>
          <WhatsApp className="mr-2 h-4 w-4" />
          <span>Del på WhatsApp</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare('email')}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Del via e-post</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Lenke kopiert!</span>
            </>
          ) : (
            <>
              <LinkIcon className="mr-2 h-4 w-4" />
              <span>Kopier lenke</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
