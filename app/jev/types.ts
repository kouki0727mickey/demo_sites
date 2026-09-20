export type ChoiceAnswer = {type:'choice';choice:string;confidence:number;probabilities:Record<string,number>};
export type ScoreAnswer = {type:'score';score:number;confidence:number;legend:Record<string,string>;probabilities:Record<string,number>};
export type NoulAnswer = {type:'noul';noul:number};
export type Evaluation = {model:string;answers:Record<string,ChoiceAnswer|ScoreAnswer|NoulAnswer>;usage?:{input_tokens:number;output_tokens:number}};
export type Scenario = {
  id:string;name:string;title:string;description:string;inputLabel:string;rubric:string;disclaimer:string;
  samples:{label:string;text:string}[];
  choice:{key:string;label:string;instructions:string;options:Record<string,string>;criteria:Record<string,string>};
  score:{key:string;label:string;instructions:string;criteria:string[];scale:string};
  noul:{key:string;label:string;instructions:string;yes:string;no:string};
  sample:{choice:string;probabilities:Record<string,number>;scoreProbabilities:number[];noul:number};
};
