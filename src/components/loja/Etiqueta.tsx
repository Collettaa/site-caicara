import { reais } from "./reais";

interface Props {
  preco: number;
  precoPix: number | null;
  /** Anotação à mão no pé da etiqueta. */
  nota?: string;
  balanca?: boolean;
  pequena?: boolean;
  className?: string;
}

/** Etiqueta amarela pendurada: preço do Pix em destaque, cartão embaixo. */
export function Etiqueta({ preco, precoPix, nota, balanca = false, pequena = false, className = "" }: Props) {
  const temPix = precoPix !== null && precoPix < preco;
  return (
    <div className={`etiqueta-wrap ${balanca ? "etiqueta-balanca" : ""} ${pequena ? "etiqueta-pequena" : ""} ${className}`}>
      <span className="etiqueta-cordao" aria-hidden="true" />
      <div className="etiqueta">
        <span className="etiqueta-preco">{reais(temPix ? precoPix : preco)}</span>
        {temPix ? (
          <>
            <span className="text-sm font-semibold">no Pix</span>
            <span className="whitespace-nowrap text-xs">ou {reais(preco)} no cartão</span>
          </>
        ) : null}
        {nota ? <span className="etiqueta-nota mt-1 whitespace-nowrap">{nota}</span> : null}
      </div>
    </div>
  );
}
