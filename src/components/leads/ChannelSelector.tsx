import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MapPin, Handshake, MessageCircle, Globe } from 'lucide-react';

export type SourceChannel = 'physical' | 'partnership' | 'whatsapp' | 'website';

interface ChannelSelectorProps {
  value: SourceChannel;
  onChange: (channel: SourceChannel) => void;
  partnerCode: string;
  onPartnerCodeChange: (code: string) => void;
  techReference?: string;
  onTechReferenceChange?: (ref: string) => void;
}

const channels: { value: SourceChannel; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: 'physical',
    label: 'Physical',
    icon: MapPin,
    description: 'Field visit with geo-tagging',
  },
  {
    value: 'partnership',
    label: 'Partnership',
    icon: Handshake,
    description: 'Partner/DSA referral',
  },
  {
    value: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    description: 'WhatsApp lead',
  },
  {
    value: 'website',
    label: 'Website',
    icon: Globe,
    description: 'Online application',
  },
];

export function ChannelSelector({
  value,
  onChange,
  partnerCode,
  onPartnerCodeChange,
  techReference,
  onTechReferenceChange,
}: ChannelSelectorProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Label className="text-sm font-medium mb-3 block">Lead Source Channel</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const isSelected = value === channel.value;
            return (
              <button
                key={channel.value}
                type="button"
                onClick={() => onChange(channel.value)}
                className={cn(
                  'flex flex-col items-center p-4 rounded-lg border-2 transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                )}
              >
                <Icon className={cn('w-6 h-6 mb-2', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                  {channel.label}
                </span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {channel.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Partnership Mode - Partner Code */}
        {value === 'partnership' && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="space-y-2">
              <Label htmlFor="partner_code">Partner Code *</Label>
              <Input
                id="partner_code"
                placeholder="Enter partner/DSA code"
                value={partnerCode}
                onChange={(e) => onPartnerCodeChange(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Enter the DSA/Partner code for commission tracking
              </p>
            </div>
          </div>
        )}

        {/* Tech Mode - Reference ID */}
        {(value === 'whatsapp' || value === 'website') && onTechReferenceChange && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="space-y-2">
              <Label htmlFor="tech_reference">
                {value === 'whatsapp' ? 'WhatsApp Chat ID' : 'Web Application ID'}
              </Label>
              <Input
                id="tech_reference"
                placeholder={value === 'whatsapp' ? 'Enter WhatsApp conversation ID' : 'Enter web form submission ID'}
                value={techReference || ''}
                onChange={(e) => onTechReferenceChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional reference for tracking the lead source
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
