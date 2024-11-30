
@json
export class DocumentationLink {
  title!: string;
  url!: string;
}


@json
export class DocumentationResponse {
  success!: boolean;
  documentation!: string;
  response!: string;
  links!: DocumentationLink[];
}


@json
export class DgraphResponseLink {
  title!: string;
  url!: string;
  snippet!: string;
}
