"use client";

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    forwardRef,
    useImperativeHandle,
    useMemo,
    type ReactNode,
    type MouseEvent as ReactMouseEvent,
    type FormEvent,
    type SVGProps,
} from 'react';
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
    type Transition,
    type VariantLabels,
    type Target,
    type AnimationControls,
    type TargetAndTransition,
    type Variants,
} from 'framer-motion';
import { PatternCard, PatternCardBody } from '../ui/card-with-ellipsis-pattern';
import { Card } from '../ui/card';
import Image from 'next/image';
import { ShimmerButton } from '../ui/shimmer-button';

function cn(...classes: (string | undefined | null | boolean)[]): string {
    return classes.filter(Boolean).join(" ");
}

interface RotatingTextRef {
    next: () => void;
    previous: () => void;
    jumpTo: (index: number) => void;
    reset: () => void;
}

interface RotatingTextProps
    extends Omit<
        React.ComponentPropsWithoutRef<typeof motion.span>,
        "children" | "transition" | "initial" | "animate" | "exit"
    > {
    texts: string[];
    transition?: Transition;
    initial?: boolean | Target | VariantLabels;
    animate?: boolean | VariantLabels | AnimationControls | TargetAndTransition;
    exit?: Target | VariantLabels;
    animatePresenceMode?: "sync" | "wait";
    animatePresenceInitial?: boolean;
    rotationInterval?: number;
    staggerDuration?: number;
    staggerFrom?: "first" | "last" | "center" | "random" | number;
    loop?: boolean;
    auto?: boolean;
    splitBy?: "characters" | "words" | "lines" | string;
    onNext?: (index: number) => void;
    mainClassName?: string;
    splitLevelClassName?: string;
    elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
    (
        {
            texts,
            transition = { type: "spring", damping: 25, stiffness: 300 },
            initial = { y: "100%", opacity: 0 },
            animate = { y: 0, opacity: 1 },
            exit = { y: "-120%", opacity: 0 },
            animatePresenceMode = "wait",
            animatePresenceInitial = false,
            rotationInterval = 2200,
            staggerDuration = 0.01,
            staggerFrom = "last",
            loop = true,
            auto = true,
            splitBy = "characters",
            onNext,
            mainClassName,
            splitLevelClassName,
            elementLevelClassName,
            ...rest
        },
        ref
    ) => {
        const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

        const splitIntoCharacters = (text: string): string[] => {
            if (typeof Intl !== "undefined" && Intl.Segmenter) {
                try {
                    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
                    return Array.from(segmenter.segment(text), (segment) => segment.segment);
                } catch (error) {
                    console.error("Intl.Segmenter failed, falling back to simple split:", error);
                    return text.split('');
                }
            }
            return text.split('');
        };

        const elements = useMemo(() => {
            const currentText: string = texts[currentTextIndex] ?? '';
            if (splitBy === "characters") {
                const words = currentText.split(/(\s+)/);
                let charCount = 0;
                return words.filter(part => part.length > 0).map((part) => {
                    const isSpace = /^\s+$/.test(part);
                    const chars = isSpace ? [part] : splitIntoCharacters(part);
                    const startIndex = charCount;
                    charCount += chars.length;
                    return { characters: chars, isSpace: isSpace, startIndex: startIndex };
                });
            }
            if (splitBy === "words") {
                return currentText.split(/(\s+)/).filter(word => word.length > 0).map((word, i) => ({
                    characters: [word], isSpace: /^\s+$/.test(word), startIndex: i
                }));
            }
            if (splitBy === "lines") {
                return currentText.split('\n').map((line, i) => ({
                    characters: [line], isSpace: false, startIndex: i
                }));
            }
            return currentText.split(splitBy).map((part, i) => ({
                characters: [part], isSpace: false, startIndex: i
            }));
        }, [texts, currentTextIndex, splitBy]);

        const totalElements = useMemo(() => elements.reduce((sum, el) => sum + el.characters.length, 0), [elements]);

        const getStaggerDelay = useCallback(
            (index: number, total: number): number => {
                if (total <= 1 || !staggerDuration) return 0;
                const stagger = staggerDuration;
                switch (staggerFrom) {
                    case "first": return index * stagger;
                    case "last": return (total - 1 - index) * stagger;
                    case "center":
                        const center = (total - 1) / 2;
                        return Math.abs(center - index) * stagger;
                    case "random": return Math.random() * (total - 1) * stagger;
                    default:
                        if (typeof staggerFrom === 'number') {
                            const fromIndex = Math.max(0, Math.min(staggerFrom, total - 1));
                            return Math.abs(fromIndex - index) * stagger;
                        }
                        return index * stagger;
                }
            },
            [staggerFrom, staggerDuration]
        );

        const handleIndexChange = useCallback(
            (newIndex: number) => {
                setCurrentTextIndex(newIndex);
                onNext?.(newIndex);
            },
            [onNext]
        );

        const next = useCallback(() => {
            const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
            if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex);
        }, [currentTextIndex, texts.length, loop, handleIndexChange]);

        const previous = useCallback(() => {
            const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
            if (prevIndex !== currentTextIndex) handleIndexChange(prevIndex);
        }, [currentTextIndex, texts.length, loop, handleIndexChange]);

        const jumpTo = useCallback(
            (index: number) => {
                const validIndex = Math.max(0, Math.min(index, texts.length - 1));
                if (validIndex !== currentTextIndex) handleIndexChange(validIndex);
            },
            [texts.length, currentTextIndex, handleIndexChange]
        );

        const reset = useCallback(() => {
            if (currentTextIndex !== 0) handleIndexChange(0);
        }, [currentTextIndex, handleIndexChange]);

        useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);

        useEffect(() => {
            if (!auto || texts.length <= 1) return;
            const intervalId = setInterval(next, rotationInterval);
            return () => clearInterval(intervalId);
        }, [next, rotationInterval, auto, texts.length]);

        return (
            <motion.span
                className={cn("inline-flex flex-wrap whitespace-pre-wrap relative align-bottom pb-[10px]", mainClassName)}
                {...rest}
                layout
            >
                <span className="sr-only">{texts[currentTextIndex]}</span>
                <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
                    <motion.div
                        key={currentTextIndex}
                        className={cn(
                            "inline-flex flex-wrap relative",
                            splitBy === "lines" ? "flex-col items-start w-full" : "flex-row items-baseline"
                        )}
                        layout
                        aria-hidden="true"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {elements.map((elementObj, elementIndex) => (
                            <span
                                key={elementIndex}
                                className={cn("inline-flex", splitBy === 'lines' ? 'w-full' : '', splitLevelClassName)}
                                style={{ whiteSpace: 'pre' }}
                            >
                                {elementObj.characters.map((char, charIndex) => {
                                    const globalIndex = elementObj.startIndex + charIndex;
                                    return (
                                        <motion.span
                                            key={`${char}-${charIndex}`}
                                            initial={initial}
                                            animate={animate}
                                            exit={exit}
                                            transition={{
                                                ...transition,
                                                delay: getStaggerDelay(globalIndex, totalElements),
                                            }}
                                            className={cn("inline-block leading-none tracking-tight", elementLevelClassName)}
                                        >
                                            {char === ' ' ? '\u00A0' : char}
                                        </motion.span>
                                    );
                                })}
                            </span>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </motion.span>
        );
    }
);
RotatingText.displayName = "RotatingText";

const ShinyText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => (
    <span className={cn("relative overflow-hidden inline-block", className)}>
        {text}
        <span style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'shine 2s infinite linear',
            opacity: 0.5,
            pointerEvents: 'none'
        }}></span>
        <style>{`
            @keyframes shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `}</style>
    </span>
);

const ChevronDownIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 ml-1 inline-block transition-transform duration-200 group-hover:rotate-180" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const MenuIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const CloseIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const ExternalLinkIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

interface NavLinkProps {
    href?: string;
    children: ReactNode;
    hasDropdown?: boolean;
    className?: string;
    onClick?: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href = "#", children, hasDropdown = false, className = "", onClick }) => (
    <motion.a
        href={href}
        onClick={onClick}
        className={cn("relative group text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 flex items-center py-1", className)}
        whileHover="hover"
    >
        {children}
        {hasDropdown && <ChevronDownIcon />}
        {!hasDropdown && (
            <motion.div
                className="absolute bottom-[-2px] left-0 right-0 h-[1px] bg-[#0CF2A0]"
                variants={{ initial: { scaleX: 0, originX: 0.5 }, hover: { scaleX: 1, originX: 0.5 } }}
                initial="initial"
                transition={{ duration: 0.3, ease: "easeOut" }}
            />
        )}
    </motion.a>
);

interface DropdownMenuProps {
    children: ReactNode;
    isOpen: boolean;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, isOpen }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 origin-top z-40"
            >
                <div className="bg-[#111111] border border-gray-700/50 rounded-md shadow-xl p-2">
                    {children}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

interface DropdownItemProps {
    href?: string;
    children: ReactNode;
    icon?: React.ReactElement<SVGProps<SVGSVGElement>>;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ href = "#", children, icon }) => (
    <a
        href={href}
        className="group flex items-center justify-between w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/30 hover:text-white rounded-md transition-colors duration-150"
    >
        <span>{children}</span>
        {icon && React.cloneElement(icon, { className: "w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" })}
    </a>
);

interface Dot {
    x: number;
    y: number;
    baseColor: string;
    targetOpacity: number;
    currentOpacity: number;
    opacitySpeed: number;
    baseRadius: number;
    currentRadius: number;
}

const InteractiveHero: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState<boolean>(false);

    const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 10);
    });

    const dotsRef = useRef<Dot[]>([]);
    const gridRef = useRef<Record<string, number[]>>({});
    const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
    const mousePositionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

    const DOT_SPACING = 25;
    const BASE_OPACITY_MIN = 0.40;
    const BASE_OPACITY_MAX = 0.50;
    const BASE_RADIUS = 1;
    const INTERACTION_RADIUS = 150;
    const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
    const OPACITY_BOOST = 0.6;
    const RADIUS_BOOST = 2.5;
    const GRID_CELL_SIZE = Math.max(50, Math.floor(INTERACTION_RADIUS / 1.5));

    const handleMouseMove = useCallback((event: globalThis.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            mousePositionRef.current = { x: null, y: null };
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        mousePositionRef.current = { x: canvasX, y: canvasY };
    }, []);

    const createDots = useCallback(() => {
        const { width, height } = canvasSizeRef.current;
        if (width === 0 || height === 0) return;

        const newDots: Dot[] = [];
        const newGrid: Record<string, number[]> = {};
        const cols = Math.ceil(width / DOT_SPACING);
        const rows = Math.ceil(height / DOT_SPACING);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * DOT_SPACING + DOT_SPACING / 2;
                const y = j * DOT_SPACING + DOT_SPACING / 2;
                const cellX = Math.floor(x / GRID_CELL_SIZE);
                const cellY = Math.floor(y / GRID_CELL_SIZE);
                const cellKey = `${cellX}_${cellY}`;

                if (!newGrid[cellKey]) {
                    newGrid[cellKey] = [];
                }

                const dotIndex = newDots.length;
                newGrid[cellKey].push(dotIndex);

                const baseOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
                newDots.push({
                    x,
                    y,
                    baseColor: `rgba(87, 220, 205, ${BASE_OPACITY_MAX})`,
                    targetOpacity: baseOpacity,
                    currentOpacity: baseOpacity,
                    opacitySpeed: (Math.random() * 0.005) + 0.002,
                    baseRadius: BASE_RADIUS,
                    currentRadius: BASE_RADIUS,
                });
            }
        }
        dotsRef.current = newDots;
        gridRef.current = newGrid;
    }, [DOT_SPACING, GRID_CELL_SIZE, BASE_OPACITY_MIN, BASE_OPACITY_MAX, BASE_RADIUS]);

    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const container = canvas.parentElement;
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;

        if (canvas.width !== width || canvas.height !== height ||
            canvasSizeRef.current.width !== width || canvasSizeRef.current.height !== height) {
            canvas.width = width;
            canvas.height = height;
            canvasSizeRef.current = { width, height };
            createDots();
        }
    }, [createDots]);

    const animateDots = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const dots = dotsRef.current;
        const grid = gridRef.current;
        const { width, height } = canvasSizeRef.current;
        const { x: mouseX, y: mouseY } = mousePositionRef.current;

        if (!ctx || !dots || !grid || width === 0 || height === 0) {
            animationFrameId.current = requestAnimationFrame(animateDots);
            return;
        }

        ctx.clearRect(0, 0, width, height);

        const activeDotIndices = new Set<number>();
        if (mouseX !== null && mouseY !== null) {
            const mouseCellX = Math.floor(mouseX / GRID_CELL_SIZE);
            const mouseCellY = Math.floor(mouseY / GRID_CELL_SIZE);
            const searchRadius = Math.ceil(INTERACTION_RADIUS / GRID_CELL_SIZE);
            for (let i = -searchRadius; i <= searchRadius; i++) {
                for (let j = -searchRadius; j <= searchRadius; j++) {
                    const checkCellX = mouseCellX + i;
                    const checkCellY = mouseCellY + j;
                    const cellKey = `${checkCellX}_${checkCellY}`;
                    if (grid[cellKey]) {
                        grid[cellKey].forEach(dotIndex => activeDotIndices.add(dotIndex));
                    }
                }
            }
        }

        dots.forEach((dot, index) => {
            dot.currentOpacity += dot.opacitySpeed;
            if (dot.currentOpacity >= dot.targetOpacity || dot.currentOpacity <= BASE_OPACITY_MIN) {
                dot.opacitySpeed = -dot.opacitySpeed;
                dot.currentOpacity = Math.max(BASE_OPACITY_MIN, Math.min(dot.currentOpacity, BASE_OPACITY_MAX));
                dot.targetOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
            }

            let interactionFactor = 0;
            dot.currentRadius = dot.baseRadius;

            if (mouseX !== null && mouseY !== null && activeDotIndices.has(index)) {
                const dx = dot.x - mouseX;
                const dy = dot.y - mouseY;
                const distSq = dx * dx + dy * dy;

                if (distSq < INTERACTION_RADIUS_SQ) {
                    const distance = Math.sqrt(distSq);
                    interactionFactor = Math.max(0, 1 - distance / INTERACTION_RADIUS);
                    interactionFactor = interactionFactor * interactionFactor;
                }
            }

            const finalOpacity = Math.min(1, dot.currentOpacity + interactionFactor * OPACITY_BOOST);
            dot.currentRadius = dot.baseRadius + interactionFactor * RADIUS_BOOST;

            const colorMatch = dot.baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            const r = colorMatch ? colorMatch[1] : '87';
            const g = colorMatch ? colorMatch[2] : '220';
            const b = colorMatch ? colorMatch[3] : '205';

            ctx.beginPath();
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity.toFixed(3)})`;
            ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
            ctx.fill();
        });

        animationFrameId.current = requestAnimationFrame(animateDots);
    }, [GRID_CELL_SIZE, INTERACTION_RADIUS, INTERACTION_RADIUS_SQ, OPACITY_BOOST, RADIUS_BOOST, BASE_OPACITY_MIN, BASE_OPACITY_MAX, BASE_RADIUS]);

    useEffect(() => {
        handleResize();
        const canvasElement = canvasRef.current;
        const handleMouseLeave = () => {
            mousePositionRef.current = { x: null, y: null };
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('resize', handleResize);
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);


        animationFrameId.current = requestAnimationFrame(animateDots);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [handleResize, handleMouseMove, animateDots]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    const headerVariants: Variants = {
        top: {
            backgroundColor: "rgba(17, 17, 17, 0.8)",
            borderBottomColor: "rgba(55, 65, 81, 0.5)",
            position: 'fixed',
            boxShadow: 'none',
        },
        scrolled: {
            backgroundColor: "rgba(17, 17, 17, 0.95)",
            borderBottomColor: "rgba(75, 85, 99, 0.7)",
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            position: 'fixed'
        }
    };

    const mobileMenuVariants: Variants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.15, ease: "easeIn" } }
    };

    const contentDelay = 0.3;
    const itemDelayIncrement = 0.1;

    const bannerVariants: Variants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: contentDelay } }
    };
    const headlineVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement } }
    };
    const subHeadlineVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 2 } }
    };
    const formVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 3 } }
    };
    const trialTextVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 4 } }
    };
    const worksWithVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 5 } }
    };
    const imageVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, delay: contentDelay + itemDelayIncrement * 6, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <div className="bg-background pt-[100px] relative text-gray-300 min-h-screen flex flex-col overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />
            <div className="absolute inset-0 z-1 pointer-events-none" style={{
                background: 'linear-gradient(to bottom, transparent 0%, #111111 90%), radial-gradient(ellipse at center, transparent 40%, #111111 95%)'
            }}></div>

            <motion.header
                variants={headerVariants}
                initial="top"
                animate={isScrolled ? "scrolled" : "top"}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="px-6 w-full md:px-10 lg:px-16 sticky top-0 z-30 backdrop-blur-md border-b"
            >
                <nav className="flex justify-between items-center max-w-screen-xl mx-auto h-[70px]">
                    <div className="flex items-center flex-shrink-0">
                        <Image src="/conflow-logo-dark.svg" alt="Logo" width={140} height={100} />
                    </div>

                    <div className="hidden md:flex items-center justify-center flex-grow space-x-6 lg:space-x-8 px-4">
                        <NavLink href="#">Product</NavLink>
                        <NavLink href="#">Customers</NavLink>

                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('channels')}
                            onMouseLeave={() => setOpenDropdown(null)}
                        >
                            <NavLink href="#" hasDropdown>Channels</NavLink>
                            <DropdownMenu isOpen={openDropdown === 'channels'}>
                                <DropdownItem href="#">Slack</DropdownItem>
                                <DropdownItem href="#">Microsoft Teams</DropdownItem>
                                <DropdownItem href="#">Discord</DropdownItem>
                                <DropdownItem href="#">Email</DropdownItem>
                                <DropdownItem href="#">Web Chat</DropdownItem>
                            </DropdownMenu>
                        </div>

                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('resources')}
                            onMouseLeave={() => setOpenDropdown(null)}
                        >
                            <NavLink href="#" hasDropdown>Resources</NavLink>
                            <DropdownMenu isOpen={openDropdown === 'resources'}>
                                <DropdownItem href="#" icon={<ExternalLinkIcon />}>Blog</DropdownItem>
                                <DropdownItem href="#">Guides</DropdownItem>
                                <DropdownItem href="#">Help Center</DropdownItem>
                                <DropdownItem href="#">API Reference</DropdownItem>
                            </DropdownMenu>
                        </div>

                        <NavLink href="#">Docs</NavLink>
                        <NavLink href="#">Pricing</NavLink>
                    </div>

                    <div className="flex items-center flex-shrink-0 space-x-4 lg:space-x-6">
                        <NavLink href="/signin" className="hidden md:inline-block">Sign in</NavLink>

                        <motion.a
                            href="/signin"
                            className="bg-[#0CF2A0] text-[#111111] px-4 py-[6px] rounded-md text-sm font-semibold hover:bg-opacity-90 transition-colors duration-200 whitespace-nowrap shadow-sm hover:shadow-md"
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                            무료로 시작하기
                        </motion.a>

                        <motion.button
                            className="md:hidden text-gray-300 hover:text-white z-50"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        >
                            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </motion.button>
                    </div>
                </nav>

                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            key="mobile-menu"
                            variants={mobileMenuVariants} initial="hidden" animate="visible" exit="exit"
                            className="md:hidden absolute top-full left-0 right-0 bg-[#111111]/95 backdrop-blur-sm shadow-lg py-4 border-t border-gray-800/50"
                        >
                            <div className="flex flex-col items-center space-y-4 px-6">
                                <NavLink href="#" onClick={() => setIsMobileMenuOpen(false)}>Product</NavLink>
                                <NavLink href="#" onClick={() => setIsMobileMenuOpen(false)}>Customers</NavLink>
                                <NavLink href="#" onClick={() => setIsMobileMenuOpen(false)}>Channels</NavLink>
                                <NavLink href="#" onClick={() => setIsMobileMenuOpen(false)}>Resources</NavLink>
                                <NavLink href="#" onClick={() => setIsMobileMenuOpen(false)}>Docs</NavLink>
                                <NavLink href="#" onClick={() => setIsMobileMenuOpen(false)}>Pricing</NavLink>
                                <hr className="w-full border-t border-gray-700/50 my-2" />
                                <NavLink href="/signin" onClick={() => setIsMobileMenuOpen(false)}>Sign in</NavLink>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-8 pb-16 relative z-10">

                <motion.div
                    variants={bannerVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-6"
                >
                    <ShinyText text="Beta 런칭 기념 14일 무료 체험" className="bg-[#1a1a1a] border border-gray-700 text-[#0CF2A0] px-4 py-1 rounded-full text-xs sm:text-sm font-medium cursor-pointer hover:border-[#0CF2A0]/50 transition-colors" />
                </motion.div>

                <motion.h1
                    variants={headlineVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-4xl sm:text-5xl lg:text-[64px] font-semibold text-white leading-tight max-w-4xl mb-4"
                >
                    <span className="inline-block h-[1.2em] sm:h-[1.2em] lg:h-[1.2em] overflow-hidden align-bottom">
                        <RotatingText
                            texts={['8배 적은 시간투자로', '5배 적은 에너지로', '7배 꾸준한 페이스로', '10배 규칙적인 시간에', '9배 흥미로운 내용으로']}
                            mainClassName="text-[#0CF2A0] mx-1"
                            staggerFrom={"last"}
                            initial={{ y: "-100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "110%", opacity: 0 }}
                            staggerDuration={0.01}
                            transition={{ type: "spring", damping: 18, stiffness: 250 }}
                            rotationInterval={2200}
                            splitBy="characters"
                            auto={true}
                            loop={true}
                        />
                    </span>
                    <br />{' '}
                    끊임없이 흐르는 스레드 콘텐츠
                </motion.h1>

                <motion.p
                    variants={subHeadlineVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-8"
                >
                    압도적인 발행량, 시스템의 차이에 달려있습니다
                </motion.p>

                <motion.form
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full max-w-md mx-auto mb-3"
                    onSubmit={(e: FormEvent<HTMLFormElement>) => e.preventDefault()}
                >
                    <ShimmerButton className="shadow-2xl" onClick={() => window.location.href = '/signin'}>
                        <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                            무료로 시작하기
                        </span>
                    </ShimmerButton>
                </motion.form>

                <motion.p
                    variants={trialTextVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-xs text-gray-500 mb-10"
                >
                    베타테스터 한정 14일 무료사용
                </motion.p>

                <motion.div
                    variants={imageVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-4xl mx-auto px-4 sm:px-0 mb-32"
                >
                    <img
                        src="https://help.apple.com/assets/679AD2D1E874AD22770DE1E0/679AD2D56EA7B10C9E01288F/en_US/3d2b57c8027ae355aa44421899389008.png"
                        alt="Product screen preview showing collaborative features"
                        width={1024}
                        height={640}
                        className="w-full h-auto object-contain rounded-lg shadow-xl border border-gray-700/50"
                        loading="lazy"
                    />
                </motion.div>

                <motion.div
                    variants={imageVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-4xl mx-auto px-4 sm:px-0 mb-32"
                >
                    <div className="text-2xl font-bold mb-10">
                        스레드는 왜 어려운걸까요?
                    </div>

                    <div className="flex gap-4">
                        <Card variant="plus" title="꾸준한 발행이 어려워요" description="매일 꾸준히 콘텐츠를 발행하는 일은 우리 모에게 어려운 일이애요" className="max-w-[400px] bg-background" />
                        <Card variant="plus" title="콘텐츠 아이디어를 찾기 어려워요" description="발행할 콘텐츠 소재를 찾다가 시간이 훌쩍 지나가기도 하죠" className="max-w-[400px] bg-background" />
                        <Card variant="plus" title="수시로 관리하기 번거로워요" description="여러개의 포스트에 달리는 댓글들도 계속 신경을 써야 해요" className="max-w-[400px] bg-background" />
                    </div>
                </motion.div>


                <motion.div
                    variants={imageVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-4xl mx-auto px-4 sm:px-0 mb-32"
                >

                    <PatternCard>
                        <PatternCardBody>
                            <h3 className="text-lg font-bold mb-1 text-foreground">
                                수시로 관리하는데 한계가  있음
                            </h3>
                            <p className="text-wrap text-sm text-foreground/60">
                                Build intelligent conversational experiences with our ready-to-use
                                chat components.
                            </p>
                        </PatternCardBody>
                    </PatternCard>
                </motion.div>


            </main>
        </div>
    );
};

export default InteractiveHero;