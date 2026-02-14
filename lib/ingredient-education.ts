/**
 * Ingredient Education System
 * Provides detailed, educational explanations about ingredients
 * Written in a helpful, scientific, and accessible way
 */

import { Ingredient, findIngredient } from './ingredient-intelligence';

export interface IngredientEducation {
  overview: string; // 2-3 sentence overview
  detailedExplanation: string; // Multi-paragraph detailed explanation
  benefits: string[]; // Specific benefits
  function: string[]; // What it does (e.g., "Solvent", "Humectant")
  howItWorks: string; // Mechanism of action
  skinImpact: string; // How it affects skin
  concentrationInfo: string; // Information about effective concentrations
  safetyNotes: string; // Safety considerations
  research: string; // Research/evidence summary
}

/**
 * Generate detailed educational content for an ingredient
 */
export function getIngredientEducation(ingredientName: string): IngredientEducation | null {
  const ingredient = findIngredient(ingredientName);
  if (!ingredient) {
    return getGenericEducation(ingredientName);
  }

  return generateEducationFromIngredient(ingredient);
}

/**
 * Generate education from ingredient data
 */
function generateEducationFromIngredient(ingredient: Ingredient): IngredientEducation {
  const categoryDescriptions: Record<string, string> = {
    active: 'an active ingredient',
    emollient: 'an emollient',
    preservative: 'a preservative',
    fragrance: 'a fragrance ingredient',
    surfactant: 'a surfactant (cleansing agent)',
    humectant: 'a humectant (moisture-binding ingredient)',
    occlusive: 'an occlusive (barrier-forming ingredient)',
    antioxidant: 'an antioxidant',
    other: 'a cosmetic ingredient',
  };

  const categoryDesc = categoryDescriptions[ingredient.category] || 'a cosmetic ingredient';

  // Generate overview
  const overview = `${ingredient.name} is ${categoryDesc} commonly found in skincare formulations. ${ingredient.efficacy.proven ? `It has been extensively studied (${ingredient.efficacy.studies}+ peer-reviewed studies) and is proven effective for ${ingredient.efficacy.conditions.join(', ')}.` : 'While commonly used, its efficacy is still being researched.'} ${ingredient.safety.irritation === 'low' ? 'It is generally well-tolerated by most skin types.' : ingredient.safety.irritation === 'medium' ? 'It may cause mild irritation in sensitive individuals.' : 'It can cause irritation, especially in sensitive skin.'}`;

  // Generate detailed explanation - Multi-paragraph format like the example
  let detailedExplanation = `${ingredient.name}${ingredient.scientificName ? ` (${ingredient.scientificName})` : ''} is ${categoryDesc} commonly found in cosmetic and skincare formulations${ingredient.inciName !== ingredient.name ? `, listed on ingredient labels as ${ingredient.inciName}` : ''}. `;
  
  // First paragraph: What it is and its role
  detailedExplanation += `Its primary role in skincare is to ${getPrimaryFunction(ingredient.category)}. `;
  
  if (ingredient.category === 'humectant') {
    detailedExplanation += `As a humectant, it has the remarkable ability to bind water molecules - in fact, some forms can hold up to 1000 times their weight in water. This creates a plumping effect on the skin, temporarily filling in fine lines and improving the appearance of texture. `;
  } else if (ingredient.category === 'occlusive') {
    detailedExplanation += `As an occlusive, it forms a protective barrier on the skin's surface, similar to how a seal prevents air from escaping. This barrier significantly reduces transepidermal water loss (TEWL), which is the natural process of water evaporating from your skin. `;
  } else if (ingredient.category === 'active') {
    detailedExplanation += `As an active ingredient, it penetrates beyond the skin's surface to interact with skin cells at a deeper level, delivering therapeutic benefits that go beyond simple cosmetic improvement. `;
  }

  // Second paragraph: Scientific understanding and research
  if (ingredient.efficacy.proven) {
    detailedExplanation += `\n\nResearch has extensively studied ${ingredient.name}, with ${ingredient.efficacy.studies}+ peer-reviewed studies published in dermatological journals. `;
    detailedExplanation += `${ingredient.efficacy.mechanism || `The mechanism of action involves ${getDefaultMechanism(ingredient.category)}`}. `;
    
    if (ingredient.efficacy.effectiveness === 'high') {
      detailedExplanation += `Its high efficacy rating is based on consistent, reproducible results across multiple clinical trials, making it one of the most reliable ingredients in evidence-based skincare. `;
    } else if (ingredient.efficacy.effectiveness === 'medium') {
      detailedExplanation += `While effective, results may vary more between individuals compared to higher-efficacy ingredients. `;
    }
    
    if (ingredient.sources.length > 0) {
      detailedExplanation += `Key research includes studies demonstrating ${ingredient.efficacy.conditions.slice(0, 2).join(' and ')} improvements. `;
    }
  } else {
    detailedExplanation += `\n\nWhile ${ingredient.name} is widely used in skincare formulations, the scientific evidence for its specific efficacy is still emerging. `;
    detailedExplanation += `More rigorous, controlled studies are needed to fully understand its benefits and optimal usage patterns. `;
    detailedExplanation += `This doesn't mean it's ineffective, but rather that the evidence base is still developing. `;
  }

  // Third paragraph: Practical considerations
  detailedExplanation += `\n\nIn practical terms, ${ingredient.name} works by ${ingredient.efficacy.mechanism || getDefaultMechanism(ingredient.category)}. `;
  
  if (ingredient.concentration.effective > 0) {
    detailedExplanation += `For optimal results, this ingredient is typically effective at concentrations of ${ingredient.concentration.effective}% or higher. `;
    detailedExplanation += `Most products on the market contain around ${ingredient.concentration.typical}%, which provides a good balance between efficacy and safety. `;
    if (ingredient.concentration.maximum > 0) {
      detailedExplanation += `However, concentrations above ${ingredient.concentration.maximum}% may increase the risk of irritation, especially for sensitive skin types. `;
    }
  }

  // Safety considerations paragraph
  if (ingredient.safety.comedogenic > 0 || ingredient.safety.irritation !== 'low') {
    detailedExplanation += `\n\nRegarding safety, `;
    if (ingredient.safety.comedogenic > 0) {
      detailedExplanation += `${ingredient.name} has a comedogenic rating of ${ingredient.safety.comedogenic}/5 on the comedogenic scale. `;
      if (ingredient.safety.comedogenic <= 2) {
        detailedExplanation += `This low rating means it's unlikely to clog pores for most people, making it suitable for acne-prone skin. `;
      } else if (ingredient.safety.comedogenic <= 3) {
        detailedExplanation += `This moderate rating suggests it may contribute to pore-clogging in some individuals, particularly those with oily or acne-prone skin. `;
      } else {
        detailedExplanation += `This higher rating indicates a greater likelihood of clogging pores, and those with acne-prone or oily skin should use products containing this ingredient with caution. `;
      }
    }
    
    if (ingredient.safety.irritation !== 'low') {
      detailedExplanation += `In terms of irritation potential, ${ingredient.name} is rated as ${ingredient.safety.irritation} risk. `;
      if (ingredient.safety.irritation === 'medium') {
        detailedExplanation += `This means it may cause mild to moderate irritation, particularly in sensitive skin types or when used at higher concentrations. `;
      } else {
        detailedExplanation += `This means it can cause significant irritation, especially when first introduced to your routine. It's crucial to start slowly, use lower concentrations initially, and always patch test before applying to your entire face. `;
      }
    }
  }

  // Add skin impact
  let skinImpact = '';
  if (ingredient.efficacy.conditions.length > 0) {
    skinImpact = `When applied to the skin, ${ingredient.name} primarily addresses ${ingredient.efficacy.conditions.join(', ')}. `;
    skinImpact += `It achieves this through ${ingredient.efficacy.mechanism || getDefaultMechanism(ingredient.category)}. `;
    
    if (ingredient.category === 'humectant') {
      skinImpact += `As a humectant, it draws moisture from the environment and deeper skin layers to the surface, creating a plumping effect and improving skin's hydration levels. `;
    } else if (ingredient.category === 'occlusive') {
      skinImpact += `As an occlusive, it forms a protective barrier on the skin's surface, preventing water loss and maintaining hydration. `;
    } else if (ingredient.category === 'active') {
      skinImpact += `As an active ingredient, it penetrates the skin to deliver therapeutic benefits, working at a cellular level to improve skin health and appearance. `;
    }
  }

  // Generate benefits
  const benefits: string[] = [];
  ingredient.efficacy.conditions.forEach(condition => {
    const benefitMap: Record<string, string> = {
      'acne': 'Acne Treatment',
      'hyperpigmentation': 'Brightening',
      'dark spots': 'Dark Spot Reduction',
      'fine lines': 'Anti-Aging',
      'wrinkles': 'Wrinkle Reduction',
      'hydration': 'Hydration',
      'texture': 'Texture Improvement',
      'pore size': 'Pore Minimizing',
      'barrier function': 'Barrier Repair',
      'sensitivity': 'Soothing',
      'redness': 'Redness Reduction',
      'plumping': 'Skin Plumping',
    };
    const benefit = benefitMap[condition] || condition.charAt(0).toUpperCase() + condition.slice(1);
    if (!benefits.includes(benefit)) {
      benefits.push(benefit);
    }
  });

  // Generate function
  const functionList: string[] = [];
  if (ingredient.category === 'humectant') functionList.push('Humectant');
  if (ingredient.category === 'occlusive') functionList.push('Occlusive');
  if (ingredient.category === 'emollient') functionList.push('Emollient');
  if (ingredient.category === 'surfactant') functionList.push('Surfactant');
  if (ingredient.category === 'active') functionList.push('Active Ingredient');
  if (ingredient.category === 'antioxidant') functionList.push('Antioxidant');
  if (ingredient.category === 'preservative') functionList.push('Preservative');
  if (functionList.length === 0) functionList.push('Cosmetic Ingredient');

  // Generate how it works
  const howItWorks = ingredient.efficacy.mechanism || getDefaultMechanism(ingredient.category);

  // Generate concentration info
  let concentrationInfo = '';
  if (ingredient.concentration.effective > 0) {
    concentrationInfo = `Effective concentrations typically range from ${ingredient.concentration.effective}% to ${ingredient.concentration.maximum || ingredient.concentration.typical}%. `;
    concentrationInfo += `Most products contain around ${ingredient.concentration.typical}% for optimal balance between efficacy and safety. `;
    if (ingredient.concentration.maximum > 0) {
      concentrationInfo += `Concentrations above ${ingredient.concentration.maximum}% may increase the risk of irritation.`;
    }
  }

  // Generate safety notes
  let safetyNotes = '';
  if (ingredient.safety.irritation === 'high') {
    safetyNotes = `⚠️ High irritation potential: Introduce slowly, start with lower concentrations, and always patch test. `;
  } else if (ingredient.safety.irritation === 'medium') {
    safetyNotes = `⚠️ Moderate irritation potential: May cause sensitivity in some individuals. Patch testing recommended. `;
  }
  
  if (ingredient.safety.comedogenic >= 3) {
    safetyNotes += `⚠️ Comedogenic rating ${ingredient.safety.comedogenic}/5: May clog pores, especially for oily or acne-prone skin. `;
  }
  
  if (ingredient.safety.pregnancy === 'avoid') {
    safetyNotes += `⚠️ Not recommended during pregnancy or breastfeeding. `;
  } else if (ingredient.safety.pregnancy === 'caution') {
    safetyNotes += `⚠️ Use with caution during pregnancy - consult your healthcare provider. `;
  }

  if (ingredient.interactions.avoidWith.length > 0) {
    safetyNotes += `⚠️ Avoid combining with: ${ingredient.interactions.avoidWith.join(', ')}. `;
  }

  // Generate research summary
  let research = '';
  if (ingredient.efficacy.proven && ingredient.sources.length > 0) {
    research = `This ingredient is supported by ${ingredient.efficacy.studies}+ peer-reviewed studies. `;
    research += `Key research includes: ${ingredient.sources[0]}`;
    if (ingredient.sources.length > 1) {
      research += ` and ${ingredient.sources.length - 1} additional study${ingredient.sources.length > 2 ? 'ies' : 'y'}.`;
    }
  } else {
    research = `While commonly used, the scientific evidence for this ingredient is still emerging. More research is needed to fully understand its efficacy and optimal usage.`;
  }

  return {
    overview,
    detailedExplanation,
    benefits,
    function: functionList,
    howItWorks,
    skinImpact,
    concentrationInfo,
    safetyNotes,
    research,
  };
}

/**
 * Get default mechanism based on category
 */
function getDefaultMechanism(category: string): string {
  const mechanisms: Record<string, string> = {
    active: 'interacting with skin cells to produce therapeutic effects',
    humectant: 'binding water molecules and drawing moisture to the skin',
    occlusive: 'forming a protective barrier on the skin surface',
    emollient: 'softening and smoothing the skin by filling gaps between skin cells',
    surfactant: 'reducing surface tension to help cleanse and remove impurities',
    antioxidant: 'neutralizing free radicals that cause oxidative damage',
    preservative: 'preventing microbial growth and product spoilage',
  };
  return mechanisms[category] || 'providing cosmetic benefits';
}

/**
 * Get primary function description
 */
function getPrimaryFunction(category: string): string {
  const functions: Record<string, string> = {
    active: 'deliver therapeutic benefits to improve skin health and appearance',
    humectant: 'draw moisture from the environment and deeper skin layers to the surface',
    occlusive: 'form a protective barrier that prevents water loss',
    emollient: 'soften and smooth the skin by filling microscopic gaps between skin cells',
    surfactant: 'cleanse the skin by reducing surface tension and removing oil and impurities',
    antioxidant: 'protect the skin from oxidative damage caused by free radicals',
    preservative: 'prevent microbial contamination and extend product shelf life',
    fragrance: 'provide scent to the product',
  };
  return functions[category] || 'contribute to the product formulation';
}

/**
 * Get generic education for unknown ingredients
 */
function getGenericEducation(ingredientName: string): IngredientEducation {
  return {
    overview: `${ingredientName} is a cosmetic ingredient commonly found in skincare formulations. Its specific properties and efficacy may vary depending on concentration and formulation.`,
    detailedExplanation: `${ingredientName} is a cosmetic ingredient used in various skincare products. While it's a recognized ingredient in cosmetic formulations, detailed information about its specific mechanism of action and efficacy may require further research. As with any skincare ingredient, individual responses can vary, and it's important to consider your skin type and any sensitivities when using products containing this ingredient.`,
    benefits: [],
    function: ['Cosmetic Ingredient'],
    howItWorks: 'Functions as a cosmetic ingredient in the formulation',
    skinImpact: 'The specific impact on skin depends on the ingredient\'s properties and concentration in the product.',
    concentrationInfo: 'Concentration information is not available for this ingredient.',
    safetyNotes: 'Always patch test new products and discontinue use if irritation occurs.',
    research: 'Limited research data available for this specific ingredient.',
  };
}

/**
 * Generate detailed explanation for how product affects user's skin
 */
export function generateProductSkinImpact(
  productName: string,
  ingredients: string[],
  userSkinType: string,
  userConcerns: string[]
): string {
  const ingredientData = ingredients
    .map(name => findIngredient(name))
    .filter((ing): ing is Ingredient => ing !== null);

  const actives = ingredientData.filter(ing => ing.category === 'active');
  const humectants = ingredientData.filter(ing => ing.category === 'humectant');
  const occlusives = ingredientData.filter(ing => ing.category === 'occlusive');

  let explanation = `${productName} contains a combination of ingredients that work together to address your skin's needs. `;

  // Address user concerns
  const addressedConcerns: string[] = [];
  actives.forEach(active => {
    active.efficacy.conditions.forEach(condition => {
      if (userConcerns.some(concern => 
        concern.toLowerCase().includes(condition.toLowerCase()) ||
        condition.toLowerCase().includes(concern.toLowerCase())
      )) {
        if (!addressedConcerns.includes(condition)) {
          addressedConcerns.push(condition);
        }
      }
    });
  });

  if (addressedConcerns.length > 0) {
    explanation += `Specifically, this product addresses your ${addressedConcerns.join(' and ')} concerns through active ingredients like ${actives.filter(a => addressedConcerns.some(c => a.efficacy.conditions.includes(c))).map(a => a.name).join(', ')}. `;
  }

  // Hydration information
  if (humectants.length > 0 || occlusives.length > 0) {
    explanation += `For hydration, the formula includes ${humectants.length > 0 ? `humectants like ${humectants.slice(0, 2).map(h => h.name).join(' and ')} that draw moisture to your skin` : ''}${humectants.length > 0 && occlusives.length > 0 ? ', and ' : ''}${occlusives.length > 0 ? `occlusives like ${occlusives.slice(0, 2).map(o => o.name).join(' and ')} that lock in that moisture` : ''}. `;
  }

  // Skin type considerations
  if (userSkinType === 'sensitive') {
    const highIrritation = ingredientData.filter(ing => ing.safety.irritation === 'high');
    if (highIrritation.length > 0) {
      explanation += `However, for sensitive skin like yours, be aware that this product contains ${highIrritation.map(i => i.name).join(' and ')}, which may cause irritation. It's recommended to patch test first and introduce gradually. `;
    }
  } else if (userSkinType === 'oily') {
    const comedogenic = ingredientData.filter(ing => ing.safety.comedogenic >= 3);
    if (comedogenic.length > 0) {
      explanation += `For oily skin, note that this product contains ${comedogenic.map(i => i.name).join(' and ')}, which have higher comedogenic ratings and may contribute to breakouts. Monitor your skin's response. `;
    }
  } else if (userSkinType === 'dry') {
    if (occlusives.length > 0) {
      explanation += `For dry skin, the occlusive ingredients in this formula will help prevent moisture loss, which is beneficial for your skin type. `;
    }
  }

  explanation += `Overall, this product is designed to work synergistically, with each ingredient playing a specific role in improving your skin's health and appearance.`;

  return explanation;
}

