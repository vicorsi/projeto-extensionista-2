package br.com.ebdgestao.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "planos_licoes")
@Getter
@Setter
public class PlanoLicao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classe_id", nullable = false)
    private ClasseEbd classe;

    @Column(name = "numero_licao")
    private Integer numeroLicao;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(name = "texto_biblico", length = 200)
    private String textoBiblico;

    @Column(name = "data_sugerida")
    private LocalDate dataSugerida;
}
