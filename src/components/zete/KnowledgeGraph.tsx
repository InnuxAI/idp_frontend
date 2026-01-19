
"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { GraphData, GraphLink, GraphNode } from "../../types/zete-types";
import {
    IconFocusCentered,
    IconZoomIn,
    IconZoomOut,
    IconFlame,
    IconPlayerPause,
    IconPlayerPlay,
    IconChevronUp,
    IconTag,
} from "@tabler/icons-react";

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="p-4 text-center text-gray-400 dark:text-zinc-500">Loading Graph...</div>
}) as any; // Cast to any to avoid type issues with dynamic import refs

// Custom spring animation keyframes
const springKeyframes = `
@keyframes springIn {
    0% { opacity: 0; transform: scale(0.3) translateY(20px); }
    60% { opacity: 1; transform: scale(1.08) translateY(-3px); }
    80% { transform: scale(0.96) translateY(1px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes springOut {
    0% { opacity: 1; transform: scale(1) translateY(0); }
    20% { opacity: 1; transform: scale(1.05) translateY(-2px); }
    100% { opacity: 0; transform: scale(0.3) translateY(20px); }
}
@keyframes containerSlideIn {
    0% { opacity: 0; transform: translateY(20px) scale(0.9); }
    60% { transform: translateY(-4px) scale(1.02); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes containerSlideOut {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    30% { transform: translateY(-4px) scale(1.02); }
    100% { opacity: 0; transform: translateY(20px) scale(0.9); }
}
@keyframes rippleExpand {
    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
    100% { box-shadow: 0 0 0 14px rgba(99, 102, 241, 0); }
}
`;

// Toolbar Button Component with micro-interactions
interface ToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    isVisible?: boolean;
    animationDelay?: number;
}

function ToolbarButton({ icon, label, onClick, isActive, isVisible = true, animationDelay = 0 }: ToolbarButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            style={{
                animation: isVisible
                    ? `springIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1) ${animationDelay}ms both`
                    : `springOut 250ms cubic-bezier(0.55, 0.06, 0.68, 0.19) ${animationDelay}ms both`,
            }}
            className={`
                relative group flex items-center justify-center
                w-9 h-9 rounded-lg
                transition-all duration-200 ease-out
                ${isActive
                    ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 shadow-inner'
                    : isPressed
                        ? 'bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 scale-95'
                        : isHovered
                            ? 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-zinc-300 scale-105'
                            : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }
            `}
            title={label}
        >
            <span className={`
                transition-transform duration-200 ease-out
                ${isPressed ? 'scale-90' : isHovered ? 'scale-110' : 'scale-100'}
            `}>
                {icon}
            </span>
            {/* Tooltip */}
            <span className={`
                absolute right-full mr-2 px-2 py-1
                text-xs font-medium text-white bg-gray-800 rounded-md
                whitespace-nowrap pointer-events-none
                transition-all duration-200 ease-out
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
            `}>
                {label}
            </span>
        </button>
    );
}

// Toggle Button with ripple animation
function ToolbarToggle({ isExpanded, onClick }: { isExpanded: boolean; onClick: () => void }) {
    const [showRipple, setShowRipple] = useState(false);

    const handleClick = () => {
        setShowRipple(true);
        setTimeout(() => setShowRipple(false), 500);
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            className={`
                relative flex items-center justify-center
                w-9 h-9 rounded-lg
                bg-gradient-to-br from-indigo-500 to-indigo-600
                text-white shadow-md
                transition-all duration-300 ease-out
                hover:shadow-lg hover:scale-105
                active:scale-95
            `}
            style={{
                animation: showRipple ? 'rippleExpand 500ms ease-out' : 'none',
            }}
            title={isExpanded ? "Collapse Toolbar" : "Expand Toolbar"}
        >
            <IconChevronUp
                size={18}
                stroke={2}
                className={`
                    transition-transform duration-300 ease-out
                    ${isExpanded ? 'rotate-180' : 'rotate-0'}
                `}
            />
        </button>
    );
}

interface KnowledgeGraphProps {
    data: GraphData;
    onNodeClick: (node: GraphNode) => void;
    onNodeRightClick?: (node: GraphNode, x: number, y: number) => void;
}

export function KnowledgeGraph({ data, onNodeClick, onNodeRightClick }: KnowledgeGraphProps) {
    const fgRef = useRef<any>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Interaction State
    const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
    const [highlightLinks, setHighlightLinks] = useState(new Set<GraphLink>());
    const [selectedNodes, setSelectedNodes] = useState(new Set<string>());

    // Ripple effect state
    const [rippleNode, setRippleNode] = useState<string | null>(null);
    const [rippleProgress, setRippleProgress] = useState(0);
    const rippleAnimationRef = useRef<number | null>(null);
    const rippleStartTimeRef = useRef<number>(0);

    // Toolbar state
    const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);
    const [showEdgeLabels, setShowEdgeLabels] = useState(true);

    // Spinning gradient rotation state
    const [spinRotation, setSpinRotation] = useState(0);
    const spinAnimationRef = useRef<number | null>(null);

    // Theme detection
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();

        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Prepare graph data with neighbors and links
    const gData = useMemo(() => {
        if (!data) return { nodes: [], links: [] };
        const clonedData = JSON.parse(JSON.stringify(data));
        const nodesMap = new Map<string, any>(clonedData.nodes.map((n: GraphNode) => [n.id, n]));

        clonedData.links.forEach((link: any) => {
            const a = nodesMap.get(typeof link.source === 'object' ? link.source.id : link.source);
            const b = nodesMap.get(typeof link.target === 'object' ? link.target.id : link.target);

            if (a && b) {
                !a.neighbors && (a.neighbors = []);
                !b.neighbors && (b.neighbors = []);
                a.neighbors.push(b);
                b.neighbors.push(a);

                !a.links && (a.links = []);
                !b.links && (b.links = []);
                a.links.push(link);
                b.links.push(link);
            }
        });
        return clonedData;
    }, [data]);

    // Update dimensions - depend on mounted to ensure ref is attached
    useEffect(() => {
        if (!mounted || !containerRef.current) return;

        const observeTarget = containerRef.current;

        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            });
        });

        resizeObserver.observe(observeTarget);

        // Get initial dimensions
        const rect = observeTarget.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });

        return () => {
            resizeObserver.disconnect();
        };
    }, [mounted]);

    // Ripple animation loop
    useEffect(() => {
        if (rippleNode) {
            rippleStartTimeRef.current = performance.now();

            const animate = (timestamp: number) => {
                const elapsed = timestamp - rippleStartTimeRef.current;
                const progress = Math.min(elapsed / 1000, 1); // 1 second animation
                setRippleProgress(progress);

                if (progress < 1) {
                    rippleAnimationRef.current = requestAnimationFrame(animate);
                }
            };

            rippleAnimationRef.current = requestAnimationFrame(animate);

            return () => {
                if (rippleAnimationRef.current) {
                    cancelAnimationFrame(rippleAnimationRef.current);
                }
            };
        } else {
            setRippleProgress(0);
        }
    }, [rippleNode]);

    // Continuous spinning animation for selected nodes
    useEffect(() => {
        const animateSpin = () => {
            setSpinRotation(prev => (prev + 2) % 360); // 2 degrees per frame
            spinAnimationRef.current = requestAnimationFrame(animateSpin);
        };

        if (selectedNodes.size > 0) {
            spinAnimationRef.current = requestAnimationFrame(animateSpin);
        }

        return () => {
            if (spinAnimationRef.current) {
                cancelAnimationFrame(spinAnimationRef.current);
            }
        };
    }, [selectedNodes.size]);

    // Color mapping - selected nodes keep their original color
    const getNodeColor = (node: GraphNode) => {
        switch (node.group) {
            case 1: return "#7C3AED"; // MSA
            case 2: return "#2563EB"; // SOW
            case 3: return "#059669"; // Invoice
            case 4: return "#D97706"; // Addendum
            case 5: return "#DC2626"; // NDA
            case 6: return "#49ca38ff"; // Organization
            case 7: return "#DB2777"; // VisitingCard
            case 8: return "#0891B2"; // Brochure
            default: return "#6B7280";
        }
    };

    // Get ripple-affected nodes and links
    const getRippleConnections = useCallback((nodeId: string) => {
        const node = gData.nodes.find((n: any) => n.id === nodeId);
        if (!node) return { nodes: new Set<string>(), links: new Set<GraphLink>() };

        const connectedNodes = new Set<string>();
        const connectedLinks = new Set<GraphLink>();

        connectedNodes.add(nodeId);
        node.neighbors?.forEach((neighbor: any) => connectedNodes.add(neighbor.id));
        node.links?.forEach((link: any) => connectedLinks.add(link));

        return { nodes: connectedNodes, links: connectedLinks };
    }, [gData]);

    // Hover Handler
    const handleNodeHover = (node: any) => {
        const newHighlightNodes = new Set<string>();
        const newHighlightLinks = new Set<GraphLink>();

        if (node) {
            newHighlightNodes.add(node.id);
            node.neighbors?.forEach((neighbor: any) => newHighlightNodes.add(neighbor.id));
            node.links?.forEach((link: any) => newHighlightLinks.add(link));
        }

        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
    };

    const handleLinkHover = (link: any) => {
        const newHighlightNodes = new Set<string>();
        const newHighlightLinks = new Set<GraphLink>();

        if (link) {
            newHighlightLinks.add(link);
            newHighlightNodes.add(typeof link.source === 'object' ? link.source.id : link.source);
            newHighlightNodes.add(typeof link.target === 'object' ? link.target.id : link.target);
        }

        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
    };

    // Mouse down/up handlers for ripple effect
    const handleNodeMouseDown = useCallback((node: any) => {
        setRippleNode(node.id);
    }, []);



    // Click Handler
    const handleNodeClick = (node: GraphNode, event: MouseEvent) => {
        const newSelectedNodes = new Set(selectedNodes);

        if (event.ctrlKey || event.shiftKey || event.metaKey) {
            if (newSelectedNodes.has(node.id)) {
                newSelectedNodes.delete(node.id);
            } else {
                newSelectedNodes.add(node.id);
            }
        } else {
            const wasSelected = newSelectedNodes.has(node.id) && newSelectedNodes.size === 1;
            newSelectedNodes.clear();
            if (!wasSelected) {
                newSelectedNodes.add(node.id);
            }
        }

        setSelectedNodes(newSelectedNodes);
        onNodeClick(node);

        if (newSelectedNodes.size === 1 && newSelectedNodes.has(node.id)) {
            fgRef.current?.centerAt(node['x'] as any, node['y'] as any, 1000);
            fgRef.current?.zoom(3, 2000);
        }
    };

    // Custom Canvas Painting
    const paintRing = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
        const isHighlighted = highlightNodes.has(node.id);
        const isSelected = selectedNodes.has(node.id);
        const R = 6;

        // Ripple effect
        if (rippleNode) {
            const connections = getRippleConnections(rippleNode);
            const isRippleSource = node.id === rippleNode;
            const isRippleConnected = connections.nodes.has(node.id) && !isRippleSource;

            if (isRippleSource) {
                // Pulsing ring on the source node
                const pulseScale = 1 + Math.sin(rippleProgress * Math.PI * 4) * 0.3;
                const pulseOpacity = 0.6 - rippleProgress * 0.4;

                // Outer ripple ring
                ctx.beginPath();
                ctx.arc(node.x, node.y, R * (2 + rippleProgress * 2), 0, 2 * Math.PI);
                ctx.strokeStyle = `rgba(79, 70, 229, ${0.8 - rippleProgress * 0.8})`;
                ctx.lineWidth = 3 - rippleProgress * 2;
                ctx.stroke();

                // Inner pulse
                ctx.beginPath();
                ctx.arc(node.x, node.y, R * pulseScale * 1.5, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(99, 102, 241, ${pulseOpacity})`;
                ctx.fill();
            } else if (isRippleConnected) {
                // Delayed ripple on connected nodes
                const delay = 0.3; // 300ms delay
                const adjustedProgress = Math.max(0, (rippleProgress - delay) / (1 - delay));

                if (adjustedProgress > 0) {
                    const waveOpacity = Math.sin(adjustedProgress * Math.PI) * 0.6;
                    const waveScale = 1 + adjustedProgress * 0.8;

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, R * waveScale * 1.5, 0, 2 * Math.PI);
                    ctx.fillStyle = `rgba(129, 140, 248, ${waveOpacity})`;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, R * (1.2 + adjustedProgress * 0.5), 0, 2 * Math.PI);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${waveOpacity})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }

        // Normal highlight/selection rings
        if (isHighlighted || isSelected) {
            if (isSelected) {
                // --- Spinning Gradient Ring for Selected Nodes ---
                const ringRadius = R * 1.8;
                const ringWidth = 3;
                const rotationRad = (spinRotation * Math.PI) / 180;

                // Create a conic gradient effect using multiple arc segments
                const segments = 36; // Number of gradient segments
                const segmentAngle = (2 * Math.PI) / segments;

                // Gradient colors (vibrant rainbow)
                const gradientColors = [
                    '#F59E0B', // Amber
                    '#EF4444', // Red
                    '#EC4899', // Pink
                    '#8B5CF6', // Purple
                    '#3B82F6', // Blue
                    '#10B981', // Emerald
                    '#F59E0B', // Amber (loop back)
                ];

                for (let i = 0; i < segments; i++) {
                    const startAngle = rotationRad + i * segmentAngle;
                    const endAngle = rotationRad + (i + 1) * segmentAngle;

                    // Calculate color based on position in gradient
                    const colorPosition = i / segments;
                    const colorIndex = colorPosition * (gradientColors.length - 1);
                    const colorStart = Math.floor(colorIndex);
                    const colorEnd = Math.min(colorStart + 1, gradientColors.length - 1);
                    const colorBlend = colorIndex - colorStart;

                    // Interpolate between colors
                    const startColor = gradientColors[colorStart];
                    const endColor = gradientColors[colorEnd];

                    // Parse hex colors to RGB
                    const parseHex = (hex: string) => ({
                        r: parseInt(hex.slice(1, 3), 16),
                        g: parseInt(hex.slice(3, 5), 16),
                        b: parseInt(hex.slice(5, 7), 16),
                    });

                    const c1 = parseHex(startColor);
                    const c2 = parseHex(endColor);
                    const r = Math.round(c1.r + (c2.r - c1.r) * colorBlend);
                    const g = Math.round(c1.g + (c2.g - c1.g) * colorBlend);
                    const b = Math.round(c1.b + (c2.b - c1.b) * colorBlend);

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, ringRadius, startAngle, endAngle);
                    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.lineWidth = ringWidth;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }

                // Inner glow fill
                ctx.beginPath();
                ctx.arc(node.x, node.y, R * 1.4, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
                ctx.fill();

            } else if (isHighlighted) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, R * 1.5, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
                ctx.fill();
            }
        }
    }, [highlightNodes, selectedNodes, rippleNode, rippleProgress, getRippleConnections, spinRotation]);

    // Custom link rendering for ripple effect
    const getLinkColor = useCallback((link: any) => {
        if (rippleNode) {
            const connections = getRippleConnections(rippleNode);
            if (connections.links.has(link)) {
                const pulseIntensity = Math.sin(rippleProgress * Math.PI * 3) * 0.5 + 0.5;
                return `rgba(79, 70, 229, ${0.4 + pulseIntensity * 0.6})`;
            }
        }
        return highlightLinks.has(link) ? "#4F46E5" : isDark ? "#52525b" : "#CBD5E1";
    }, [rippleNode, rippleProgress, highlightLinks, getRippleConnections, isDark]);

    const getLinkWidth = useCallback((link: any) => {
        if (rippleNode) {
            const connections = getRippleConnections(rippleNode);
            if (connections.links.has(link)) {
                const pulseWidth = Math.sin(rippleProgress * Math.PI * 3) * 2 + 3;
                return pulseWidth;
            }
        }
        return highlightLinks.has(link) ? 3 : 1.5;
    }, [rippleNode, rippleProgress, highlightLinks, getRippleConnections]);

    const getLinkParticles = useCallback((link: any) => {
        if (rippleNode) {
            const connections = getRippleConnections(rippleNode);
            if (connections.links.has(link)) {
                return 6; // More particles during ripple
            }
        }
        return highlightLinks.has(link) ? 4 : 0;
    }, [rippleNode, highlightLinks, getRippleConnections]);

    // Edge label rendering - aligned with edge direction
    const paintEdgeLabel = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!showEdgeLabels) return;

        // Truncation and visibility logic based on zoom level (globalScale)
        // globalScale ~1 is default view. <1 is zoomed out, >1 is zoomed in.

        let maxChars = 0;
        if (globalScale >= 2.0) maxChars = 100; // Full text when zoomed in
        else if (globalScale >= 1.2) maxChars = 15;
        else if (globalScale >= 0.7) maxChars = 6;
        else return; // Hide completely when very zoomed out

        const label = link.label || '';
        if (!label) return;

        let displayText = label;
        if (label.length > maxChars) {
            displayText = label.substring(0, maxChars) + (maxChars > 3 ? '..' : '.');
        }

        const source = typeof link.source === 'object' ? link.source : { x: 0, y: 0 };
        const target = typeof link.target === 'object' ? link.target : { x: 0, y: 0 };

        // Calculate midpoint
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;

        // Calculate angle
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        let angle = Math.atan2(dy, dx);

        // Keep text upright
        if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            angle += Math.PI;
        }

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);

        // Styling
        // Font size 3px/globalScale helps keep text readable but not huge
        // But the user requested simpler smaller font.
        // Let's stick to fixed small size in graph space.
        const fontSize = 3;
        const fontWeight = globalScale < 1 ? '500' : '400';
        ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom'; // Draw above line

        // Slight text outline for better contrast
        ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Color
        ctx.fillStyle = isDark ? '#a1a1aa' : '#475569'; // Zinc 400 vs Slate 600

        // Offset: 0.5px above the line
        const offsetY = -0.5;
        ctx.fillText(displayText, 0, offsetY);

        ctx.restore();
    }, [showEdgeLabels, isDark]);

    // Global mouse up listener
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (rippleNode) {
                setRippleNode(null);
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [rippleNode]);

    // Simulation state
    const [isPaused, setIsPaused] = useState(false);

    // Toolbar Actions
    const handleFitToScreen = useCallback(() => {
        fgRef.current?.zoomToFit(400, 60);
    }, []);

    const handleZoomIn = useCallback(() => {
        const currentZoom = fgRef.current?.zoom() ?? 1;
        fgRef.current?.zoom(currentZoom * 1.5, 300);
    }, []);

    const handleZoomOut = useCallback(() => {
        const currentZoom = fgRef.current?.zoom() ?? 1;
        fgRef.current?.zoom(currentZoom / 1.5, 300);
    }, []);

    const handleReheatSimulation = useCallback(() => {
        fgRef.current?.d3ReheatSimulation();
    }, []);

    const handleTogglePause = useCallback(() => {
        if (isPaused) {
            fgRef.current?.resumeAnimation();
        } else {
            fgRef.current?.pauseAnimation();
        }
        setIsPaused(!isPaused);
    }, [isPaused]);

    const handleToggleEdgeLabels = useCallback(() => {
        setShowEdgeLabels(prev => !prev);
    }, []);

    if (!mounted) return null;

    return (
        <div ref={containerRef} className="w-full h-full bg-slate-50 dark:bg-zinc-900/50 relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 shadow-inner dark:shadow-none">
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={gData}
                nodeLabel="label"
                nodeColor={getNodeColor}
                nodeRelSize={6}

                // D3 Force Configuration - bring nodes closer together
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                d3Force={(engine: any) => {
                    // Reduce charge repulsion to bring nodes closer
                    engine.force('charge')?.strength(100);
                    // Shorter link distance
                    engine.force('link')?.distance(50);
                    // Add center force to keep graph centered
                    engine.force('center')?.strength(0.1);
                }}
                onEngineStop={() => {
                    // Auto-fit to screen after simulation settles
                    fgRef.current?.zoomToFit(400, 40);
                }}

                // Highlighting Props
                linkColor={getLinkColor}
                linkWidth={getLinkWidth}
                linkDirectionalParticles={getLinkParticles}
                linkDirectionalParticleWidth={3}
                linkDirectionalParticleSpeed={0.02}

                // Custom Rendering
                nodeCanvasObjectMode={() => 'before'}
                nodeCanvasObject={paintRing}

                // Handlers
                onNodeHover={handleNodeHover}
                onLinkHover={handleLinkHover}
                onNodeClick={(node: any, event: any) => handleNodeClick(node as GraphNode, event)}
                onNodeRightClick={(node: any, event: any) => {
                    // Prevent context menu
                    // event is the mouse event in ForceGraph2D
                    // But actually ForceGraph2D might not pass the event directly as 2nd arg in all versions, 
                    // for react-force-graph-2d it usually passes (node, event) or just node.
                    // Let's check signature. 
                    // Actually, looking at docs/types: onNodeRightClick: (node, event) => ...
                    if (onNodeRightClick) {
                        onNodeRightClick(node as GraphNode, event.clientX, event.clientY);
                    }
                }}
                onNodeDrag={handleNodeMouseDown}

                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                cooldownTicks={100}

                // Edge labels
                linkCanvasObjectMode={() => showEdgeLabels ? 'after' : undefined}
                linkCanvasObject={paintEdgeLabel}
            />
            {/* Legend - Bottom Left */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 p-3 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm text-xs font-medium pointer-events-none select-none text-gray-700 dark:text-zinc-300">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#7C3AED]"></div> MSA</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#2563EB]"></div> SOW</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#059669]"></div> Invoice</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#D97706]"></div> Addendum</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#DC2626]"></div> NDA</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#49ca38ff]"></div> Organization</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#DB2777]"></div> Visiting Card</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0891B2]"></div> Brochure</div>
                <div className="mt-2 text-gray-400 dark:text-zinc-500 text-[10px] leading-tight">
                    Scroll to zoom | Hold to drag
                </div>
            </div>

            {/* Toolbar - Bottom Right */}
            <style>{springKeyframes}</style>
            <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2">
                {/* Collapsible Button Group */}
                <div
                    className={`
                        flex flex-col gap-1 p-1.5
                        bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-zinc-800 shadow-lg
                        ${!isToolbarExpanded ? 'pointer-events-none' : ''}
                    `}
                    style={{
                        animation: isToolbarExpanded
                            ? 'containerSlideIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both'
                            : 'containerSlideOut 300ms cubic-bezier(0.55, 0.06, 0.68, 0.19) both',
                    }}
                >
                    <ToolbarButton
                        icon={<IconFocusCentered size={18} stroke={1.5} />}
                        label="Fit to Screen"
                        onClick={handleFitToScreen}
                        isVisible={isToolbarExpanded}
                        animationDelay={isToolbarExpanded ? 0 : 150}
                    />
                    <div
                        className="h-px bg-gray-200 dark:bg-zinc-700 mx-1.5"
                        style={{
                            animation: isToolbarExpanded
                                ? 'springIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1) 30ms both'
                                : 'springOut 200ms cubic-bezier(0.55, 0.06, 0.68, 0.19) 120ms both'
                        }}
                    />
                    <ToolbarButton
                        icon={<IconZoomIn size={18} stroke={1.5} />}
                        label="Zoom In"
                        onClick={handleZoomIn}
                        isVisible={isToolbarExpanded}
                        animationDelay={isToolbarExpanded ? 40 : 110}
                    />
                    <ToolbarButton
                        icon={<IconZoomOut size={18} stroke={1.5} />}
                        label="Zoom Out"
                        onClick={handleZoomOut}
                        isVisible={isToolbarExpanded}
                        animationDelay={isToolbarExpanded ? 80 : 70}
                    />
                    <div
                        className="h-px bg-gray-200 dark:bg-zinc-700 mx-1.5"
                        style={{
                            animation: isToolbarExpanded
                                ? 'springIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1) 110ms both'
                                : 'springOut 200ms cubic-bezier(0.55, 0.06, 0.68, 0.19) 40ms both'
                        }}
                    />
                    <ToolbarButton
                        icon={<IconFlame size={18} stroke={1.5} />}
                        label="Reheat Simulation"
                        onClick={handleReheatSimulation}
                        isVisible={isToolbarExpanded}
                        animationDelay={isToolbarExpanded ? 120 : 30}
                    />
                    <ToolbarButton
                        icon={isPaused ? <IconPlayerPlay size={18} stroke={1.5} /> : <IconPlayerPause size={18} stroke={1.5} />}
                        label={isPaused ? "Resume Animation" : "Pause Animation"}
                        onClick={handleTogglePause}
                        isActive={isPaused}
                        isVisible={isToolbarExpanded}
                        animationDelay={isToolbarExpanded ? 160 : 0}
                    />
                    <div
                        className="h-px bg-gray-200 dark:bg-zinc-700 mx-1.5"
                        style={{
                            animation: isToolbarExpanded
                                ? 'springIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1) 190ms both'
                                : 'springOut 200ms cubic-bezier(0.55, 0.06, 0.68, 0.19) 0ms both'
                        }}
                    />
                    <ToolbarButton
                        icon={<IconTag size={18} stroke={1.5} />}
                        label={showEdgeLabels ? "Hide Edge Labels" : "Show Edge Labels"}
                        onClick={handleToggleEdgeLabels}
                        isActive={showEdgeLabels}
                        isVisible={isToolbarExpanded}
                        animationDelay={isToolbarExpanded ? 200 : 0}
                    />
                </div>

                {/* Toggle Button */}
                <ToolbarToggle
                    isExpanded={isToolbarExpanded}
                    onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
                />
            </div>
        </div>
    );
}
