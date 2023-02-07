import { TSESTree } from '@typescript-eslint/utils';

export type TMessageIds = 'invalidInline' | 'invalidOrder';
export type TOptions = [{ tailwindConfig?: string }];

export type TClassNameExtractionObject = {
  start: number;
  end: number;
  value: string;
  node: TSESTree.BaseNode;
  children: TClassNameExtractionObject[];
};
