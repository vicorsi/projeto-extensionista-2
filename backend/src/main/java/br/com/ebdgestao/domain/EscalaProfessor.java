package br.com.ebdgestao.domain;

import br.com.ebdgestao.domain.Enums.PapelEscala;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "escala_professores",
        uniqueConstraints = @UniqueConstraint(name = "uk_escala_classe_data", columnNames = {"classe_id", "data_domingo"}))
@Getter
@Setter
public class EscalaProfessor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classe_id", nullable = false)
    private ClasseEbd classe;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "professor_id", nullable = false)
    private Usuario professor;

    @Column(name = "data_domingo", nullable = false)
    private LocalDate dataDomingo;

    @Enumerated(EnumType.STRING)
    @Column(name = "papel_escala", nullable = false, length = 20)
    private PapelEscala papelEscala = PapelEscala.TITULAR;

    @Column(length = 300)
    private String observacao;
}
