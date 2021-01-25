import './treemap.css';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import data from '../data'


var el_id = 'chart';
var obj = document.getElementById(el_id);
var margin = {top: 30, right: 0, bottom: 20, left: 0},
width = 900 - margin.right - margin.left,// largura recebe a definição da largura do objeto deacordo com o tamanho de chart
height = 500 - margin.top - margin.bottom,// altura recebe 800 - margem.superior - margem.inferioe
formatNumber = d3.format(","),//define o formato de númerais
transitioning;

var x = d3.scaleLinear()
    .domain([0, width])
    .range([0, width]);
var y = d3.scaleLinear()
    .domain([0, height])
    .range([0, height]);

var treemap = d3.treemap()
    .tile(d3.treemapBinary)//algoritmo do d3 responsavel por espaçar os blocos
    .size([width, height])//determina a largura e a altra do treemap
    .paddingInner(1)//espaço entre cada retângulo
    .round(false);//diz que os tamanhos não precisa ser definidos como número inteiros

export default function Treemap() {

    const svgRef = useRef(null);
    console.log(data)

    function renderTreemap(){
        var svg = d3.select('#'+el_id).append("svg")
            .attr("width",  width + 500 )//largura
            .attr("height",  height + 150)//altura
            .style("margin-left", -margin.left + "px")//margem da esqueda
            .style("margin.right", -margin.right + "px")//margem da direita
            .append("g")
                .attr("transform", "translate(" + margin.left  + "," + margin.top + ")")

        var grandparent = svg.append("g")
                .attr("class", "grandparent");
        
            /*cria retangulos dos avós**/
            grandparent.append("rect")
                .attr("y", -margin.top)
                .attr("width", width)
                .attr("height", margin.top)
            
            grandparent.append("text")
                .attr("x", 6)
                .attr("y", 6 - margin.top)
                .attr("dy", ".75em");

             console.log(data)

        var root = d3.hierarchy(data)
            .sum(function (d) {
                    return d.size;
                })
            .sort(function (a, b) {
                return b.height - a.height || b.value - a.value
            });
        treemap(root);
        display(root);

        function display(d){
            grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));

        /* cor dos títulos**/
        grandparent
            .datum(d.parent)
            .select("rect")
            .attr("fill", function () {
                return '#bbbbbb';
            });  
        
        /**g1 recebe a inserção do grupo de grandparent*/
        var g1 = svg.insert("g", ".grandparent")
            .datum(d)//datum equivale a data, para usos dinâmicos
            .attr("class", "depth");
        console.log(g1)
        /*seleciona todos os grupos de g1**/
        var g = g1.selectAll("g")
            .data(d.children)
            .enter()
            .append("g");
        console.log(g)
        /*adicione classe e clique no manipulador para todos os gs com filhos**/
        g.filter(function (d) {
            return d.children;
        })
            .classed("children", true)
            .on("click", transition);

        g.selectAll(".child")
            .data(function (d) {//adiciona o valor de cada filho ou do raiz
                return d.children || [d];
            })
            .enter().append("rect")//cria o retângulo
            .attr("class", "child")
            .call(rect)


        /*Adiciona título retângulos pais **/
        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function (d){
                // console.log(d)
                return d.data.name;
            })               
            .attr("fill", function (d) {
                return '#bbbbbb';
            }); 

        /* Adicionar um objeto estrangeiro em vez de um objeto de texto, permite a quebra automática de texto */
        g.append("foreignObject")
            .call(rect)
            .attr("class", "foreignobj")
            .append("xhtml:div")
            .attr("dy", ".75em")
            .html(function (d) {
                console.log(d)
                return '' +
                    '<p class="title"> ' + d.data.name + '</p>' +
                    '<p>' + formatNumber(d.value) + ' horas totais' +'</p>' + 
                    '<p>' + d.data.size + ' horas'+'</p>'  
                ;
            })                    
            .attr("class", "textdiv"); //a classe textdiv nos permite estilizar o texto facilmente com CSS

            function transition(d){
            /**NÃO PASSA  o que deveria passar aqui. 
             * Ele passa apenas o evento do mouse de click 
             */

/*                 
                if (transitioning || !d) return;
                transitioning = true;

                console.log(g1)//não está chegando g1 
                var g2 = display(d),
                    t1 = g1.transition()
                    .duration(650),
                    t2 = g2.transition()
                    .duration(650);

                //Atualize o domínio somente após inserir novos elementos.
                x.domain([d.x0, d.x1]);
                y.domain([d.y0, d.y1]);

                //Ativa o anti-aliasing durante a transição.
                svg.style("shape-rendering", null);

                //Desenha nós filhos no topo dos nós pais.
                svg.selectAll(".depth")//seleciona odas as profundidades e ordena
                    .sort(function (a, b) {//ordena 
                        return a.depth - b.depth;
                    })                  

                // Entrada  gradual de texto 
                g2.selectAll("text")
                    .style("fill-opacity", 0);
                g2.selectAll("foreignObject div")
                    .style("display", "none");

                // Adicionado
                // Transição para a nova visão
                t1.selectAll("text")
                    .call(text)
                    .style("fill-opacity", 0);
                t2.selectAll("text")
                    .call(text)
                    .style("fill-opacity", 1);
                t1.selectAll("rect")
                    .call(rect);
                t2.selectAll("rect")
                    .call(rect)  

                // Foreign object - Objeto estranho 
                t1.selectAll(".textdiv")
                    .style("display", "none");
                // Adicionado 
                t1.selectAll(".foreignobj")
                    .call(foreign);
                // Adicionado 
                t2.selectAll(".textdiv")
                    .style("display", "block");
                // Adicionado 
                t2.selectAll(".foreignobj")
                    .call(foreign);

                // Adicionado 
                // Remove o nó antigo quando a transição for concluída.
                t1.on("end.remove", function(){
                    this.remove();
                    transitioning = false;
                }); */
                return g;
            }

        }
        function text(text) {
            text.attr("x", function (d) {
                return x(d.x) + 6;
            })
                .attr("y", function (d) {
                    return y(d.y) + 6;
                });
        }

        function rect(rect) {
            rect
                .attr("x", function (d) {
                    return x(d.x0);
                })
                .attr("y", function (d) {
                    return y(d.y0);
                })
                .attr("width", function (d) {
                    return x(d.x1) - x(d.x0);
                })
                .attr("height", function (d) {
                    return y(d.y1) - y(d.y0);
                })
                .attr("fill", function (d) {
                    return '#bbbbbb';
                }); 
        }

        /* Adicionado textos na posição correta após a transição */
        function foreign(foreign) {
            foreign
                 .attr("x", function (d) {
                    return x(d.x0);
                })
                .attr("y", function (d) {
                    return y(d.y0);
                }) 
                .attr("width", function (d) {
                    return x(d.x1) - x(d.x0);
                })
                .attr("height", function (d) {
                    return y(d.y1) - y(d.y0);
                });
        }
        function name(d) {
            return breadcrumbs(d)  +
                (d.parent
                ? " -  Clique para diminuir zoom"
                : " - Clique dentro do quadrado para aumentar o zoom"); 
        }

        function breadcrumbs(d) {
            var res = "";
            var sep = " > ";
            d.ancestors()
                .reverse()
                .forEach(function(i){
                        res += i.data.name + sep;
                 });
            return res
                .split(sep)
                .filter(function(i){
                    return i!== "";
                })
                .join(sep);
        }
    }
    
    useEffect(() => {
        renderTreemap();
    }, [data]);

    return (
        <div>
            <svg ref={svgRef} />
        </div>
    );

}