import * as yaml from 'js-yaml';

export const parseYaml = (yamlString: string) => {
  return yaml.load(yamlString);
}