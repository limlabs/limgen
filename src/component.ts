import fs from 'fs/promises';

export const doesComponentExist = async (componentName: string) => {
  try {
    await fs.stat(`${__dirname}/components/${componentName}.ts`);
    return true;
  } catch (error) {
    return false;
  }
}

export const ensureComponentsDirectory = async () => {
  try {
    await fs.mkdir(`infrastructure/components`, { recursive: true });
  } catch (error) {
    console.error(error);
  }
}