package br.com.ebdgestao.domain;

import br.com.ebdgestao.domain.Enums.StatusAula;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "aulas",
        uniqueConstraints = @UniqueConstraint(name = "uk_aulas_classe_data", columnNames = {"classe_id", "data_aula"}))
@Getter
@Setter
public class Aula {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classe_id", nullable = false)
    private ClasseEbd classe;

    @Column(name = "data_aula", nullable = false)
    private LocalDate dataAula;

    @Column(name = "numero_licao")
    private Integer numeroLicao;

    @Column(name = "tema_licao", length = 200)
    private String temaLicao;

    @Column(name = "leitura_biblica", length = 200)
    private String leituraBiblica;

    @Column(name = "valor_oferta", precision = 10, scale = 2)
    private BigDecimal valorOferta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAula status = StatusAula.ABERTA;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (status == null) {
            status = StatusAula.ABERTA;
        }
    }
}
