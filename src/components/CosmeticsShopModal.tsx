import React, { useState } from 'react';
import {
  ArrowHeadShape,
  ArrowStyleId,
  ThemeId,
  UserSettings,
} from '../types/game';
import { THEMES } from '../utils/theme';
import { sound } from '../utils/audio';
import { X, Star, Check, ShoppingBag, Gift, Sparkles } from 'lucide-react';

interface CosmeticsShopModalProps {
  stars: number;
  unlockedCosmetics: string[];
  settings: UserSettings;
  themeId: ThemeId;
  onUnlockItem: (itemId: string, cost: number) => void;
  onEquipItem: (type: 'style' | 'head', value: string) => void;
  onClaimSupporterBonus: () => void;
  onClose: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  type: 'style' | 'head';
  value: ArrowStyleId | ArrowHeadShape;
  cost: number;
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // Arrow Styles
  { id: 'style_clean', name: 'Clean Solid', type: 'style', value: 'clean', cost: 0, description: 'Minimalist continuous line' },
  { id: 'style_rounded', name: 'Soft Rounded', type: 'style', value: 'rounded', cost: 15, description: 'Smooth rounded pill edges' },
  { id: 'style_neon', name: 'Neon Glow', type: 'style', value: 'neon', cost: 30, description: 'Ethereal ambient glow halo' },
  { id: 'style_dotted', name: 'Dotted Flow', type: 'style', value: 'dotted', cost: 45, description: 'Geometric dashed motion path' },

  // Arrow Head Shapes
  { id: 'head_classic', name: 'Classic Triangle', type: 'head', value: 'classic', cost: 0, description: 'Sharp, clean geometric tip' },
  { id: 'head_chevron', name: 'Dual Chevron', type: 'head', value: 'chevron', cost: 15, description: 'Aerodynamic dual flight fins' },
  { id: 'head_diamond', name: 'Diamond Point', type: 'head', value: 'diamond', cost: 30, description: 'Elegant faceted diamond head' },
  { id: 'head_arc', name: 'Soft Arc', type: 'head', value: 'arc', cost: 45, description: 'Gentle curved crescent tip' },
];

export const CosmeticsShopModal: React.FC<CosmeticsShopModalProps> = ({
  stars,
  unlockedCosmetics,
  settings,
  themeId,
  onUnlockItem,
  onEquipItem,
  onClaimSupporterBonus,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'head'>('style');
  const [supporterClaimed, setSupporterClaimed] = useState(false);
  const theme = THEMES[themeId] || THEMES.light;

  const handleClaimBonus = () => {
    onClaimSupporterBonus();
    setSupporterClaimed(true);
    sound.playPowerUp();
    setTimeout(() => setSupporterClaimed(false), 3000);
  };

  const filteredItems = SHOP_ITEMS.filter((item) => item.type === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl border flex flex-col max-h-[85vh] transition-colors"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base">Cosmetic Unlocks</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono font-bold text-amber-500 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{stars}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              style={{ color: theme.textSecondary }}
              aria-label="Close shop"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 py-3 border-b" style={{ borderColor: theme.cardBorder }}>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'style'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
            }`}
          >
            Arrow Body Styles
          </button>
          <button
            onClick={() => setActiveTab('head')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'head'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
            }`}
          >
            Arrow Head Shapes
          </button>
        </div>

        {/* Item Cards */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {filteredItems.map((item) => {
            const isUnlocked = unlockedCosmetics.includes(item.id) || item.cost === 0;
            const isEquipped =
              item.type === 'style'
                ? settings.arrowStyle === item.value
                : settings.arrowHeadShape === item.value;
            const canAfford = stars >= item.cost;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border flex items-center justify-between transition-all"
                style={{ borderColor: isEquipped ? '#3b82f6' : theme.cardBorder }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-xs">{item.name}</span>
                    {isEquipped && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                        Equipped
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-70">{item.description}</p>
                </div>

                <div>
                  {isUnlocked ? (
                    <button
                      onClick={() => onEquipItem(item.type, item.value)}
                      disabled={isEquipped}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                        isEquipped
                          ? 'opacity-40 cursor-default'
                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 active:scale-95'
                      }`}
                    >
                      {isEquipped ? 'Equipped' : 'Equip'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnlockItem(item.id, item.cost)}
                      disabled={!canAfford}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95 shadow-xs'
                          : 'bg-black/10 dark:bg-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{item.cost}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pure opt-in rewarded bonus (NO NAG ADS) */}
        <div className="mt-2 pt-3 border-t flex items-center justify-between" style={{ borderColor: theme.cardBorder }}>
          <div className="text-[11px] opacity-60">
            Never forced. Play or tap to support:
          </div>
          <button
            onClick={handleClaimBonus}
            disabled={supporterClaimed}
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            title="Optional Supporter Bonus (+5 Stars)"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{supporterClaimed ? 'Stars Claimed!' : 'Supporter Bonus (+5 ⭐)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
