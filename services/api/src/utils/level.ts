export const getRequiredScoreForLevel = (level: number): number => {
    if (level <= 100) {
        if (level > 100) {
            return 26931190829 + 100000000000 * (level - 100);
        }
        
        if (level >= 60) {
            return (5000 / 3) * (4 * Math.pow(level, 3) - 3 * Math.pow(level, 2) - level) + 1.25 * Math.pow(1.8, level - 60);
        } else {
            return (5000 / 3) * (4 * Math.pow(level, 3) - 3 * Math.pow(level, 2) - level);
        }
    } else {
        return 26931190829 + 100000000000 * (level - 100);
    }
};

export const calculateLevel = (totalScore: number): number => {
    let level = 1;
    
    while (true) {
        const nextLevelScore = getRequiredScoreForLevel(level + 1);
        
        if (totalScore < nextLevelScore) {
            const currentLevelScore = getRequiredScoreForLevel(level);
            const progress = (totalScore - currentLevelScore) / (nextLevelScore - currentLevelScore);
            
            return level + progress;
        }
        
        level++;
    }
};