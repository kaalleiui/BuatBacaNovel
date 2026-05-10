'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNovelShelfStore } from '@/lib/store';
import { novelsApi, type NovelDetail, type LoreEntryParsed, type CharacterWithTheme } from '@/lib/api';
import { toast } from 'sonner';

interface MapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'character' | 'lore';
  category?: string;
  color: string;
  tags: string[];
}

interface MapEdge {
  from: string;
  to: string;
  label?: string;
}

export function LoreMapPage() {
  const { selectedNovelId, navigate } = useNovelShelfStore();
  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!selectedNovelId) return;
    novelsApi.get(selectedNovelId)
      .then((data) => setNovel(data.novel))
      .catch(() => setNovel(null))
      .finally(() => setLoading(false));
  }, [selectedNovelId]);

  // Build nodes and edges from novel data (using useMemo to avoid setState in effect)
  const { nodes, edges } = useMemo(() => {
    const newNodes: MapNode[] = [];
    const newEdges: MapEdge[] = [];
    if (!novel) return { nodes: newNodes, edges: newEdges };

    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    // Novel title as center node
    newNodes.push({
      id: 'novel-center',
      label: novel.title,
      x: centerX,
      y: centerY,
      type: 'lore',
      category: 'novel',
      color: novel.coverColor,
      tags: [],
    });

    // Character nodes around center
    const charRadius = 180;
    novel.characters.forEach((char, i) => {
      const angle = (2 * Math.PI * i) / Math.max(novel.characters.length, 1) - Math.PI / 2;
      newNodes.push({
        id: char.id,
        label: char.name,
        x: centerX + Math.cos(angle) * charRadius,
        y: centerY + Math.sin(angle) * charRadius,
        type: 'character',
        color: char.avatarColor,
        tags: [char.name.toLowerCase()],
      });
      newEdges.push({ from: 'novel-center', to: char.id });
    });

    // Lore entry nodes in outer ring
    const loreRadius = 340;
    const categoryColors: Record<string, string> = {
      character: '#C67B3C',
      backstory: '#8B6E4E',
      worldbuilding: '#5B8C5A',
      notes: '#9B2335',
    };

    novel.loreEntries.forEach((entry, i) => {
      const angle = (2 * Math.PI * i) / Math.max(novel.loreEntries.length, 1);
      const node: MapNode = {
        id: entry.id,
        label: entry.title,
        x: centerX + Math.cos(angle) * loreRadius,
        y: centerY + Math.sin(angle) * loreRadius,
        type: 'lore',
        category: entry.category,
        color: categoryColors[entry.category] || '#666',
        tags: entry.tags,
      };
      newNodes.push(node);

      // Connect lore entries to characters with matching tags
      const matchedChars = novel.characters.filter((char) =>
        entry.tags.some((tag) => tag.toLowerCase().includes(char.name.toLowerCase()) || char.name.toLowerCase().includes(tag.toLowerCase()))
      );
      if (matchedChars.length > 0) {
        matchedChars.forEach((char) => {
          newEdges.push({ from: char.id, to: entry.id, label: 'terkait' });
        });
      } else {
        // Connect to center if no matches
        newEdges.push({ from: 'novel-center', to: entry.id });
      }

      // Connect lore entries that share tags
      novel.loreEntries.forEach((other) => {
        if (other.id !== entry.id) {
          const sharedTags = entry.tags.filter((t) => other.tags.includes(t));
          if (sharedTags.length > 0) {
            const edgeExists = newEdges.some(
              (e) => (e.from === entry.id && e.to === other.id) || (e.from === other.id && e.to === entry.id)
            );
            if (!edgeExists) {
              newEdges.push({ from: entry.id, to: other.id, label: sharedTags[0] });
            }
          }
        }
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [novel, canvasSize]);

  // Canvas resize
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight - 120 });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (edge.label) {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(edge.label, midX, midY - 4);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = selectedNode?.id === node.id;
      const radius = node.type === 'character' ? 24 : node.id === 'novel-center' ? 32 : 18;

      // Shadow
      ctx.shadowColor = node.color + '40';
      ctx.shadowBlur = isSelected ? 16 : 8;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = node.type === 'character' || node.id === 'novel-center' ? '#fff' : '#fff';
      ctx.font = node.id === 'novel-center' ? 'bold 11px sans-serif' : node.type === 'character' ? 'bold 10px sans-serif' : '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (node.id === 'novel-center' || node.type === 'character') {
        // Abbreviate long names
        const abbr = node.label.length > 8 ? node.label.substring(0, 7) + '…' : node.label;
        ctx.fillText(abbr, node.x, node.y);
      }

      // Label below node for lore entries
      if (node.type === 'lore') {
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        const abbr = node.label.length > 12 ? node.label.substring(0, 11) + '…' : node.label;
        ctx.fillText(abbr, node.x, node.y + radius + 12);
      } else {
        // Name below character/center
        ctx.fillStyle = '#333';
        ctx.font = '10px sans-serif';
        ctx.fillText(node.label, node.x, node.y + radius + 14);
      }
    });

    ctx.restore();
  }, [nodes, edges, zoom, pan, selectedNode, canvasSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Click detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    const clicked = nodes.find((node) => {
      const radius = node.type === 'character' ? 24 : node.id === 'novel-center' ? 32 : 18;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < radius + 5;
    });

    setSelectedNode(clicked || null);
  };

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  // Touch handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return;
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  const handleTouchEnd = () => setDragging(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!novel) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Novel tidak ditemukan</p></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-3 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <button onClick={() => navigate('lorebook', novel.id)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold">Peta Lore</h1>
          <p className="text-xs text-muted-foreground">{novel.title}</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setZoom(Math.max(0.3, zoom - 0.2))}><ZoomOut className="w-4 h-4" /></Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" onClick={() => setZoom(Math.min(3, zoom + 0.2))}><ZoomIn className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-muted/10">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        />

        {/* Legend */}
        <div className="absolute top-3 left-3 p-3 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2">Legenda</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: novel.coverColor }} />
              <span className="text-[10px]">Novel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#C67B3C]" />
              <span className="text-[10px]">Karakter</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#5B8C5A]" />
              <span className="text-[10px]">Worldbuilding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8B6E4E]" />
              <span className="text-[10px]">Backstory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#9B2335]" />
              <span className="text-[10px]">Catatan</span>
            </div>
          </div>
        </div>

        {/* Selected Node Detail */}
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 max-w-sm mx-auto p-4 rounded-xl bg-card border border-border/50 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: selectedNode.color }}>
                {selectedNode.label.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-semibold">{selectedNode.label}</h4>
                <p className="text-[10px] text-muted-foreground">
                  {selectedNode.type === 'character' ? 'Karakter' : selectedNode.category === 'backstory' ? 'Backstory' : selectedNode.category === 'worldbuilding' ? 'Worldbuilding' : selectedNode.category === 'notes' ? 'Catatan' : 'Novel'}
                </p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="ml-auto p-1 rounded hover:bg-muted">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {selectedNode.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedNode.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-[9px] font-medium">{tag}</span>
                ))}
              </div>
            )}
            {/* Show connections */}
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground mb-1">Terhubung dengan:</p>
              <div className="flex flex-wrap gap-1">
                {edges
                  .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                  .map((e) => {
                    const connectedId = e.from === selectedNode.id ? e.to : e.from;
                    const connectedNode = nodes.find((n) => n.id === connectedId);
                    return connectedNode ? (
                      <button
                        key={connectedId}
                        onClick={() => setSelectedNode(connectedNode)}
                        className="px-2 py-0.5 rounded-full text-[9px] font-medium hover:opacity-80 text-white"
                        style={{ backgroundColor: connectedNode.color }}
                      >
                        {connectedNode.label}
                      </button>
                    ) : null;
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
