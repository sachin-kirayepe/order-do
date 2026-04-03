import type { OrderItem } from '../db/dexie';

export interface UnifiedOrder {
  name?: string;
  address?: string;
  items: OrderItem[];
}

/**
 * Parses a natural language transcript into structured order data.
 * Supports Hindi and English variations.
 */
export function parseUnifiedTranscript(transcript: string): UnifiedOrder {
  const normalized = transcript.toLowerCase();
  
  // 1. Extract Name
  // Patterns: "Mera naam [Name] hai", "My name is [Name]", "I am [Name]", "Name is [Name]"
  const nameMatch = normalized.match(/(?:mera naam|my name is|i am|name is|नाम है|नाम)\s+([^,.\saurौर]+)/i);
  const name = nameMatch ? nameMatch[1].trim() : undefined;

  // 2. Extract Address
  // Patterns: "Main [Addr] mein rehta hoon", "I live in [Addr]", "Address [Addr] hai", "Pata [Addr] hai"
  const addressMatch = normalized.match(/(?:address|pata|rehta hoon|stay at|live in|पता hai|पता)\s+([^,.\saurौर]+)/i) 
                  || normalized.match(/(?:main)\s+(.+)\s+(?:mein rehta hoon|me rehta hoon)/i);
  const address = addressMatch ? addressMatch[1].trim() : undefined;

  // 3. Extract Items 
  // We look for everything after "order", "chahiye", "items", or just the remainder
  let itemsPart = normalized;
  const itemsTrigger = normalized.match(/(?:order|chahiye|need|items|सामान|चाहिए)\s+(.+)/i);
  if (itemsTrigger) {
    itemsPart = itemsTrigger[1];
  }

  const items = parseItems(itemsPart);

  return { 
    name: name ? capitalize(name) : undefined, 
    address: address ? capitalize(address) : undefined, 
    items 
  };
}

/**
 * Internal item parser (reused and improved from VoiceItemList)
 */
function parseItems(text: string): OrderItem[] {
  // Split by common separators: "aur", "and", ",", "और"
  const segments = text.split(/,|aur|and|और/i).map(s => s.trim()).filter(Boolean);
  
  return segments.map(part => {
    // Look for quantity: "2 kilo", "5 packet", "1 dozen", "aadha litre", etc.
    const qtyMatch = part.match(/^(\d+(?:\.\d+)?\s*(?:kilo|kg|gram|gm|litre|liter|ml|packet|pack|dozen|pcs|piece|aadha|ek|do|teen|chaar|paanch)?)\s+(.+)/i);
    if (qtyMatch) {
      return { quantity: qtyMatch[1].trim(), name: qtyMatch[2].trim() };
    }
    return { quantity: '1', name: part };
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
