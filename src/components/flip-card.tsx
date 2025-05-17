/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import {
  motion,
  useSpring,
  useAnimationControls,
  MotionStyle,
} from "framer-motion";
import type { ReactNode } from "react";
import { Howl } from "howler";

interface FlipCardProps {
  /** Content to display on the front of the card */
  frontContent: ReactNode;
  /** Content to display on the back of the card */
  backContent: ReactNode;
  /** Width of the card in pixels or other CSS units */
  width?: number | string;
  /** Height of the card in pixels or other CSS units */
  height?: number | string;
  /** Whether to flip on click */
  clickToFlip?: boolean;
  /** How much the card rotates on mouse move (in degrees) */
  rotationFactor?: number;
  /** Border radius of the card */
  borderRadius?: number;
  /** Perspective value for 3D effect */
  perspective?: number;
  /** Additional CSS class names */
  className?: string;
}

const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 40,
};

const flipSound = new Howl({
  src: ["/sounds/flipcard.mp3"],
});

/**
 * FlipCard Component
 * Enhanced 3D flip card with interactive animations
 */
export const FlipCard: React.FC<FlipCardProps> = ({
  frontContent,
  backContent,
  width = 300,
  height = 400,
  clickToFlip = true,
  rotationFactor = 20,
  borderRadius = 12,
  perspective = 1200,
  className = "",
}) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);

  const handleFlip = (): void => {
    if (clickToFlip) {
      setIsFlipped((prev) => !prev);

      // Play flip sound
      flipSound.play();

      // Add a subtle bounce animation when flipping
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.4 },
      });
    }
  };

  // Handle mouse movement for 3D effect
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!cardRef.current) return;

    const element = cardRef.current;
    const rect = element.getBoundingClientRect();

    // Calculate center points and mouse position relative to card center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate rotation values with inverted Y-axis for natural feel
    const rotateYValue = ((mouseX - centerX) / centerX) * rotationFactor;
    const rotateXValue = ((centerY - mouseY) / centerY) * rotationFactor;

    // Apply spring physics for smooth animation
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  // Reset card rotation when mouse leaves
  const handleMouseLeave = (): void => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const containerStyle: MotionStyle = {
    width,
    height,
    perspective,
    position: "relative",
    cursor: clickToFlip ? "pointer" : "default",
  };

  const cardStyle: MotionStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
    transformStyle: "preserve-3d",
    rotateX,
    rotateY,
    borderRadius,
  };

  const faceStyle = (zIndex: number): MotionStyle => ({
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    overflow: "hidden",
    borderRadius,
    zIndex,
  });

  return (
    <motion.div
      className={`flip-card-container ${className}`}
      animate={controls}
      onClick={handleFlip}
      style={containerStyle}
    >
      <motion.div
        ref={cardRef}
        className="flip-card-inner"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={cardStyle}
      >
        <motion.div
          className="flip-card-front"
          animate={{
            rotateY: isFlipped ? 180 : 0,
          }}
          transition={spring}
          style={faceStyle(isFlipped ? 0 : 1)}
        >
          {frontContent}
        </motion.div>

        <motion.div
          className="flip-card-back"
          initial={{ rotateY: 180 }}
          animate={{
            rotateY: isFlipped ? 0 : 180,
          }}
          transition={spring}
          style={faceStyle(isFlipped ? 1 : 0)}
        >
          {backContent}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

interface WithFlipProps {
  variant: "Front" | "Back";
  width?: number | string;
  height?: number | string;
  clickToFlip?: boolean;
  rotationFactor?: number;
  borderRadius?: number;
  perspective?: number;
  [key: string]: any;
}

export function withFlip<P extends WithFlipProps>(
  Component: React.ComponentType<P>
): React.FC<
  Omit<P, "variant"> & {
    width?: number | string;
    height?: number | string;
    clickToFlip?: boolean;
    rotationFactor?: number;
    borderRadius?: number;
    perspective?: number;
  }
> {
  return (props) => {
    const {
      width = 300,
      height = 400,
      clickToFlip = true,
      rotationFactor = 15,
      borderRadius = 12,
      perspective = 1200,
      ...componentProps
    } = props;

    // Create front and back content using the provided component
    const frontContent = (
      <Component {...(componentProps as P)} variant="Front" />
    );
    const backContent = <Component {...(componentProps as P)} variant="Back" />;

    return (
      <FlipCard
        frontContent={frontContent}
        backContent={backContent}
        width={width}
        height={height}
        clickToFlip={clickToFlip}
        rotationFactor={rotationFactor}
        borderRadius={borderRadius}
        perspective={perspective}
      />
    );
  };
}
