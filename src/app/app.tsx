import { useState, useEffect, useRef } from "react";
import { FlipCard } from "components/flip-card";
import { Howl } from "howler";
import { AnimatePresence, motion } from "framer-motion";

interface PizzaCard {
  id: number;
  imageType: string;
  revealed: boolean;
}

type Point = {
  id: number;
  left: number;
  top: number;
};

let flippedCardIndices: number[] = [];
let scoredCombinations: number[][] = [];

const winningPoints = new Howl({
  src: ["/sounds/coin-received.mp3"],
});

const App = () => {
  const [cards, setCards] = useState<PizzaCard[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [floatingPoints, setFloatingPoints] = useState<Point[]>([]);

  const processedFlips = useRef<{ [key: number]: boolean }>({});
  const imageTypes = ["bitcoin", "pizza", "lightning", "fruit"];

  useEffect(() => {
    initializeGame();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up the game board with randomized images
  const initializeGame = () => {
    // Reset tracking variables
    flippedCardIndices = [];
    scoredCombinations = [];
    processedFlips.current = {};

    // Create 9 cards with random images (ensuring enough bitcoins and pizzas for winning combinations)
    const bitcoinCount = 3;
    const pizzaCount = 3;
    const otherCount = 3;

    let imageAssignments = [
      ...Array(bitcoinCount).fill("bitcoin"),
      ...Array(pizzaCount).fill("pizza"),
      ...Array(otherCount)
        .fill(null)
        .map(
          () =>
            imageTypes.filter((type) => type !== "bitcoin" && type !== "pizza")[
              Math.floor(Math.random() * 2)
            ]
        ),
    ];

    // Shuffle the image assignments
    imageAssignments = shuffleArray(imageAssignments);

    // Create card objects
    const newCards = Array.from({ length: 9 }, (_, index) => ({
      id: index + 1,
      imageType: imageAssignments[index],
      revealed: false,
    }));

    setCards(newCards);
    setScore(0);
    setGameActive(true);
  };

  // Shuffle an array randomly
  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Handle card flip event
  const handleCardFlip = (cardId: number) => {
    // Convert from 1-based ID to 0-based index
    const cardIndex = cardId - 1;

    // If this card was already processed recently, ignore this event to avoid duplicates
    if (processedFlips.current[cardIndex]) {
      return;
    }

    // Mark this card as processed
    processedFlips.current[cardIndex] = true;
    setTimeout(() => {
      processedFlips.current[cardIndex] = false;
    }, 1000);

    // Skip if game is not active or card is part of a scored combination
    if (!gameActive || scoredCombinations.flat().includes(cardIndex)) {
      return;
    }

    // Track the flipped card
    if (!flippedCardIndices.includes(cardIndex)) {
      flippedCardIndices.push(cardIndex);

      // Update card's revealed status
      setCards((prevCards) =>
        prevCards.map((card, idx) =>
          idx === cardIndex ? { ...card, revealed: true } : card
        )
      );

      // Check for winning combinations after enough cards are flipped
      if (flippedCardIndices.length >= 3) {
        checkWinningCombinations();
      }
    }
  };

  // Check for winning combinations in rows, columns, and diagonals
  const checkWinningCombinations = () => {
    // Get the grid arrangements for checking
    const rows = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
    ];
    const columns = [
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
    ];
    const diagonals = [
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    const lines = [...rows, ...columns, ...diagonals];

    // Check each line for winning combinations
    lines.forEach((line) => {
      // Skip if this line was already scored
      if (
        scoredCombinations.some(
          (combo) =>
            combo.length === line.length &&
            combo.every((val) => line.includes(val))
        )
      ) {
        return;
      }

      // Only check if all cards in the line are flipped
      if (line.every((index) => flippedCardIndices.includes(index))) {
        const lineTypes = line.map((index) => cards[index].imageType);

        let foundWinningCombo = false;

        const onSetAction = () => {
          setScore((prev) => prev + 10);
          foundWinningCombo = true;
          winningPoints.play();

          const left = Math.random() * 280;
          const top = Math.random() * 280;

          const newPoint: Point = {
            id: Date.now(),
            left,
            top,
          };

          setFloatingPoints((prev) => [...prev, newPoint]);

          setTimeout(() => {
            setFloatingPoints((prev) =>
              prev.filter((p) => p.id !== newPoint.id)
            );
          }, 1000);
        };

        // Case 1: All pizzas in a line
        if (lineTypes.every((type) => type === "pizza")) {
          onSetAction();
        }

        // Case 2: All bitcoins in a line
        else if (lineTypes.every((type) => type === "bitcoin")) {
          onSetAction();
        }

        // Case 3: 2 pizzas and 1 bitcoin
        else if (
          lineTypes.filter((type) => type === "pizza").length === 2 &&
          lineTypes.filter((type) => type === "bitcoin").length === 1
        ) {
          onSetAction();
        }

        // Case 4: 2 bitcoins and 1 pizza
        else if (
          lineTypes.filter((type) => type === "bitcoin").length === 2 &&
          lineTypes.filter((type) => type === "pizza").length === 1
        ) {
          onSetAction();
        }

        // If we found a winning combo, add it to our scored combinations
        if (foundWinningCombo) {
          scoredCombinations.push([...line]);
        }
      }
    });

    // Check if all cards are flipped to end game
    if (flippedCardIndices.length === 8) {
      setGameActive(false);
    }
  };

  // Reset the game
  const resetGame = () => {
    window.location.reload();
  };

  const getCardClassName = (cardIndex: number) => {
    const isInScoredCombo = scoredCombinations.flat().includes(cardIndex);
    return isInScoredCombo ? "transform scale-105 shadow-xl rounded-xl" : "";
  };

  return (
    <div className="relative">
      <div className="absolute left-10 top-6">
        <div>
          <p className="text-2xl font-bold">Score: {score}</p>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto text-center">
        <AnimatePresence>
          {floatingPoints.map((point) => (
            <motion.div
              key={point.id}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{
                position: "absolute",
                left: point.left,
                top: point.top,
              }}
              className="pointer-events-none z-[99999]"
            >
              <p className="text-white font-bold text-5xl">+10</p>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="pt-3">
          <h1 className="text-6xl uppercase font-bold text-orange-600">
            🍕Bitcoin Pizza Day!!
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-6 px-4 scale-90 -mt-2 relative">
          {cards.map((card, index) => (
            <div
              key={card.id}
              role="button"
              className={`transition-transform duration-300${getCardClassName(index)}`}
              onClick={() => handleCardFlip(card.id)}
            >
              <FlipCard
                width={270}
                height={270}
                clickToFlip
                rotationFactor={10}
                borderRadius={12}
                frontContent={
                  <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-[#fff3e0] text-white rounded-xl border-4 border-[#5C3B28] shadow-[4px_4px_0_0_#5C3B28]">
                    <div className="flex items-center justify-center">
                      <img
                        src="/image/back-card.jpg"
                        alt="back-card"
                        className="rounded-md scale-110"
                      />
                    </div>
                  </div>
                }
                backContent={
                  <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-[#fff3e0] text-white rounded-xl border-4 border-[#D97F0C] shadow-[4px_4px_0_0_#D97F0C]">
                    <div className="flex items-center justify-center">
                      <img
                        src={`/image/${card.imageType}.png`}
                        alt={card.imageType}
                        className="w-32 h-32"
                      />
                    </div>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>

      {!gameActive && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-0 m-0">
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
